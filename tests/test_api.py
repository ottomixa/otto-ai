import unittest
import requests
import requests_mock
import json
import os
from unittest.mock import patch, MagicMock

# Ensure app modules can be imported. This might be needed if running tests directly.
# If using 'python -m unittest discover', it usually handles paths correctly.
# import sys
# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils import fetch_top_models, search_models, download_model
from app.settings import DEFAULT_SETTINGS # For checking default download dir

# Sample API responses
SAMPLE_MODELS_RESPONSE = [
    {"modelId": "model1", "pipeline_tag": "text-generation", "downloads": 100},
    {"modelId": "model2", "pipeline_tag": "image-classification", "downloads": 200},
    {"modelId": "model3", "pipeline_tag": "text-generation", "downloads": 50},
]

SAMPLE_EMPTY_RESPONSE = []

class TestApiUtils(unittest.TestCase):

    @requests_mock.Mocker()
    def test_fetch_top_models_success(self, m):
        m.get("https://huggingface.co/api/models", json=SAMPLE_MODELS_RESPONSE)

        result = fetch_top_models()

        self.assertEqual(len(result), 3) # Expecting all 3 as top if API returns < 10
        self.assertEqual(result[0]['modelId'], "model1")
        self.assertEqual(result[0]['pipeline_tag'], "text-generation")
        self.assertEqual(result[1]['modelId'], "model2")
        self.assertTrue(m.called)
        self.assertEqual(m.call_count, 1)
        self.assertEqual(m.last_request.method, 'GET')
        self.assertTrue("https://huggingface.co/api/models" in m.last_request.url)


    @requests_mock.Mocker()
    def test_fetch_top_models_api_error(self, m):
        url = "https://huggingface.co/api/models"
        m.get(url, status_code=500, text="Internal Server Error")

        with patch('builtins.print') as mock_print: # Suppress print output during test
            result = fetch_top_models()

        self.assertEqual(result, [])
        self.assertTrue(m.called)
        # The exact format of HTTPError.__str__ can be subtle.
        # Based on previous actual output:
        expected_print = f"Error fetching top models: 500 Server Error: None for url: {url}"
        mock_print.assert_called_once_with(expected_print)


    @requests_mock.Mocker()
    def test_fetch_top_models_json_decode_error(self, m):
        m.get("https://huggingface.co/api/models", text="Not a valid JSON")
        with patch('builtins.print') as mock_print:
            result = fetch_top_models()
        self.assertEqual(result, [])
        # Debug print removed for brevity, previous step confirmed it's now correct
        mock_print.assert_called_once_with("Error decoding JSON response from API.")

    @requests_mock.Mocker()
    def test_search_models_success(self, m):
        query = "test_query"
        m.get(f"https://huggingface.co/api/models?search={query}", json=SAMPLE_MODELS_RESPONSE)

        result = search_models(query)

        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]['modelId'], "model1")
        self.assertTrue(m.called)
        self.assertEqual(m.last_request.qs['search'], [query])

    @requests_mock.Mocker()
    def test_search_models_no_results(self, m):
        query = "non_existent_query"
        m.get(f"https://huggingface.co/api/models?search={query}", json=SAMPLE_EMPTY_RESPONSE)

        result = search_models(query)

        self.assertEqual(result, [])
        self.assertTrue(m.called)

    @requests_mock.Mocker()
    def test_search_models_api_error(self, m):
        query = "error_query"
        url = f"https://huggingface.co/api/models?search={query}"
        m.get(url, status_code=503, text="Service Unavailable")

        with patch('builtins.print') as mock_print:
            result = search_models(query)

        self.assertEqual(result, [])
        self.assertTrue(m.called)
        # Based on previous actual output:
        expected_print = f"Error searching models for query '{query}': 503 Server Error: None for url: {url}"
        mock_print.assert_called_once_with(expected_print)

    @patch('app.utils.get_setting')
    @patch('app.utils.os.makedirs')
    @patch('app.utils.os.path.exists')
    @patch('builtins.print') # To capture the print output
    def test_download_model_placeholder_new_directory(self, mock_print, mock_exists, mock_makedirs, mock_get_setting):
        model_id = "test_model"
        custom_dir = "custom_test_downloads/"

        mock_exists.return_value = False # Directory does not exist
        mock_get_setting.return_value = custom_dir # Setting returns our custom dir

        download_model(model_id) # Call without explicit directory to use setting

        mock_get_setting.assert_called_once_with('model_directory')
        mock_exists.assert_called_once_with(custom_dir)
        mock_makedirs.assert_called_once_with(custom_dir)
        mock_print.assert_any_call(f"Created directory: {custom_dir}")
        mock_print.assert_any_call(f"Simulating download of {model_id} to {custom_dir}")

    @patch('app.utils.get_setting')
    @patch('app.utils.os.makedirs')
    @patch('app.utils.os.path.exists')
    @patch('builtins.print')
    def test_download_model_placeholder_existing_directory(self, mock_print, mock_exists, mock_makedirs, mock_get_setting):
        model_id = "another_model"
        existing_dir = "existing_downloads/"

        mock_exists.return_value = True # Directory already exists
        mock_get_setting.return_value = existing_dir

        download_model(model_id, existing_dir) # Explicitly pass directory

        mock_get_setting.assert_not_called() # Should not be called if dir is passed
        mock_exists.assert_called_once_with(existing_dir)
        mock_makedirs.assert_not_called() # Should not be called if dir exists
        mock_print.assert_any_call(f"Simulating download of {model_id} to {existing_dir}")

    @patch('app.utils.get_setting')
    @patch('app.utils.os.makedirs')
    @patch('app.utils.os.path.exists')
    @patch('builtins.print')
    def test_download_model_uses_default_settings_dir_if_not_passed(self, mock_print, mock_exists, mock_makedirs, mock_get_setting):
        model_id = "test_model_default_dir"

        # Simulate get_setting returning the default model directory
        default_settings_dir = DEFAULT_SETTINGS['model_directory']
        mock_get_setting.return_value = default_settings_dir
        mock_exists.return_value = True # Assume it exists for simplicity here

        download_model(model_id) # No directory passed, should use setting

        mock_get_setting.assert_called_once_with('model_directory')
        mock_exists.assert_called_once_with(default_settings_dir)
        mock_makedirs.assert_not_called()
        mock_print.assert_any_call(f"Simulating download of {model_id} to {default_settings_dir}")

    @patch('app.utils.get_setting', return_value=None) # Simulate setting not found
    @patch('app.utils.os.makedirs')
    @patch('app.utils.os.path.exists', return_value=False) # Fallback dir also doesn't exist
    @patch('builtins.print')
    def test_download_model_fallback_directory_creation(self, mock_print, mock_exists, mock_makedirs, mock_get_setting):
        model_id = "fallback_test"
        fallback_dir = "downloaded_models/" # This is the hardcoded fallback in download_model

        download_model(model_id)

        mock_get_setting.assert_called_once_with('model_directory')
        # os.path.exists will be called for the primary dir (None from setting), then for fallback
        mock_exists.assert_any_call(fallback_dir)
        mock_makedirs.assert_called_once_with(fallback_dir)
        mock_print.assert_any_call(f"Created directory: {fallback_dir}")
        mock_print.assert_any_call(f"Simulating download of {model_id} to {fallback_dir}")

    @patch('app.utils.get_setting')
    @patch('app.utils.os.makedirs', side_effect=OSError("Permission Denied"))
    @patch('app.utils.os.path.exists', return_value=False)
    @patch('builtins.print')
    def test_download_model_directory_creation_os_error(self, mock_print, mock_exists, mock_makedirs, mock_get_setting):
        model_id = "os_error_test"
        target_dir = "problem_dir/"
        mock_get_setting.return_value = target_dir

        download_model(model_id)

        mock_get_setting.assert_called_once_with('model_directory')
        mock_exists.assert_called_once_with(target_dir)
        mock_makedirs.assert_called_once_with(target_dir)
        mock_print.assert_any_call(f"Error creating directory {target_dir}: Permission Denied")
        # Also check that the download simulation message is NOT printed
        download_simulation_message = f"Simulating download of {model_id} to {target_dir}"
        for call_args in mock_print.call_args_list:
            self.assertNotEqual(call_args[0][0], download_simulation_message)


if __name__ == '__main__':
    unittest.main()
