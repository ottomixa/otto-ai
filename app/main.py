import tkinter as tk
from tkinter import ttk, messagebox
from app.settings import get_setting, update_setting, load_settings, DEFAULT_SETTINGS
from app.utils import fetch_top_models, search_models, download_model

class ModelBrowserApp:
    def __init__(self, root):
        self.root = root
        root.title("Hugging Face Model Browser")

        # Ensure initial settings are loaded and model_directory is available
        loaded_settings = load_settings()
        initial_model_dir = loaded_settings.get('model_directory', DEFAULT_SETTINGS['model_directory'])

        # Main PanedWindow
        self.paned_window = ttk.PanedWindow(root, orient=tk.HORIZONTAL)
        self.paned_window.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Left Frame (Settings)
        self.left_frame = ttk.Frame(self.paned_window, padding="10")
        self.paned_window.add(self.left_frame, weight=1)

        ttk.Label(self.left_frame, text="Search Models:").grid(row=0, column=0, sticky=tk.W, pady=(0, 5))
        self.search_entry = ttk.Entry(self.left_frame, width=30)
        self.search_entry.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        self.search_entry.bind("<Return>", self.perform_search_event)
        # Search button in case user prefers clicking
        self.search_button = ttk.Button(self.left_frame, text="Search", command=self.perform_search_event)
        self.search_button.grid(row=1, column=1, sticky=tk.W, padx=(5,0), pady=(0,10))


        ttk.Label(self.left_frame, text="Model Download Directory:").grid(row=2, column=0, columnspan=2, sticky=tk.W, pady=(0, 5))
        self.model_dir_entry_var = tk.StringVar(value=initial_model_dir)
        self.model_dir_entry = ttk.Entry(self.left_frame, textvariable=self.model_dir_entry_var, width=30)
        self.model_dir_entry.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))

        self.save_settings_button = ttk.Button(self.left_frame, text="Save Settings", command=self.save_app_settings)
        self.save_settings_button.grid(row=4, column=0, columnspan=2, sticky=tk.W, pady=(10, 0))

        # Right Frame (Model Display)
        self.right_frame = ttk.Frame(self.paned_window, padding="10")
        self.paned_window.add(self.right_frame, weight=3)

        self.right_frame.grid_rowconfigure(0, weight=1)
        self.right_frame.grid_columnconfigure(0, weight=1)

        self.model_listbox = tk.Listbox(self.right_frame, height=15)
        self.model_listbox.grid(row=0, column=0, sticky=(tk.N, tk.S, tk.E, tk.W), pady=(0,10))

        self.scrollbar = ttk.Scrollbar(self.right_frame, orient=tk.VERTICAL, command=self.model_listbox.yview)
        self.model_listbox.configure(yscrollcommand=self.scrollbar.set)
        self.scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S), pady=(0,10))

        self.download_button = ttk.Button(self.right_frame, text="Download Selected Model", command=self.trigger_model_download)
        self.download_button.grid(row=1, column=0, columnspan=2, sticky=tk.EW)

        self.load_initial_models()

    def _clear_model_listbox(self):
        self.model_listbox.delete(0, tk.END)

    def _populate_listbox_with_models(self, models):
        self._clear_model_listbox()
        if not models:
            self.model_listbox.insert(tk.END, "No models found.")
            return
        for model in models:
            display_text = f"{model.get('modelId', 'Unknown Model')}"
            if model.get('pipeline_tag'):
                display_text += f" ({model.get('pipeline_tag')})"
            self.model_listbox.insert(tk.END, display_text)
            # Store the full model_id as part of the item if needed, or rely on parsing
            # For simplicity, we'll parse from text, but storing data is more robust

    def load_initial_models(self):
        """Loads and displays the top models when the app starts."""
        print("Fetching initial top models...")
        models = fetch_top_models()
        if models:
            self._populate_listbox_with_models(models)
        else:
            self._clear_model_listbox()
            self.model_listbox.insert(tk.END, "Failed to load initial models.")
            messagebox.showerror("API Error", "Could not fetch top models from Hugging Face Hub. Check your internet connection or try again later.")

    def perform_search_event(self, event=None): # event is passed by bind
        """Handles the search button click or Enter key press in search entry."""
        query = self.search_entry.get().strip()
        if not query:
            print("Empty search query, fetching top models again.")
            self.load_initial_models() # Or fetch_top_models directly
            return

        print(f"Searching for models with query: '{query}'")
        models = search_models(query)
        if models:
            self._populate_listbox_with_models(models)
        else:
            self._clear_model_listbox()
            self.model_listbox.insert(tk.END, f"No models found for '{query}'.")
            messagebox.showinfo("Search Results", f"No models found matching your query: '{query}'.")


    def save_app_settings(self):
        """Saves the model download directory."""
        new_dir = self.model_dir_entry_var.get().strip()
        if not new_dir:
            messagebox.showwarning("Validation Error", "Download directory cannot be empty.")
            return

        if update_setting('model_directory', new_dir):
            print(f"Settings saved. Model directory: {new_dir}")
            messagebox.showinfo("Settings Saved", f"Model download directory updated to:\n{new_dir}")
        else:
            print("Failed to save settings.")
            messagebox.showerror("Save Error", "Failed to save settings. Please check file permissions or disk space.")

    def trigger_model_download(self):
        """Initiates download for the selected model."""
        selected_indices = self.model_listbox.curselection()
        if not selected_indices:
            messagebox.showwarning("No Model Selected", "Please select a model from the list before clicking download.")
            return

        selected_item_text = self.model_listbox.get(selected_indices[0])
        # Basic parsing, assuming format "modelId (pipeline_tag)" or just "modelId"
        model_id_to_download = selected_item_text.split(" (")[0]

        current_download_dir = get_setting('model_directory')
        if not current_download_dir: # Should ideally not happen if settings are managed well
            messagebox.showerror("Configuration Error", "Model download directory is not set.")
            return

        print(f"Attempting to download model: {model_id_to_download} to {current_download_dir}")

        # utils.download_model will print its simulation message
        # In a real app, this might be a threaded operation
        download_model(model_id_to_download, current_download_dir)

        messagebox.showinfo("Download Initiated",
                            f"Simulating download of model:\n{model_id_to_download}\n\n"
                            f"Target directory:\n{current_download_dir}")

if __name__ == "__main__":
    root = tk.Tk()
    app = ModelBrowserApp(root)
    root.mainloop()
