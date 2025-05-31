import json
import os

SETTINGS_FILE = "settings.json"
DEFAULT_SETTINGS = {'model_directory': 'downloaded_models/'}

def load_settings():
    """Reads settings from settings.json.
    If the file doesn't exist or is invalid, it returns default settings.
    """
    if not os.path.exists(SETTINGS_FILE):
        return DEFAULT_SETTINGS.copy()
    try:
        with open(SETTINGS_FILE, 'r') as f:
            settings = json.load(f)
            return settings
    except (IOError, json.JSONDecodeError):
        return DEFAULT_SETTINGS.copy()

def save_settings(settings_dict):
    """Saves the provided dictionary to settings.json."""
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings_dict, f, indent=4)
        return True
    except IOError:
        return False

_current_settings = load_settings()

def get_setting(key):
    """Returns the value of a specific setting key from the loaded settings."""
    return _current_settings.get(key)

def update_setting(key, value):
    """Updates a specific setting and saves the changes."""
    _current_settings[key] = value
    return save_settings(_current_settings)
