# app_gui.py

import customtkinter as ctk
from tkinter import filedialog
import os
import fitz # PyMuPDF

# Import our backend logic
import pdf_splitter_logic as logic

# --- UI Application Class ---
class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        # --- Window Setup ---
        self.title("PDF Splitter Pro")
        self.geometry("500x620")
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.grid_columnconfigure(0, weight=1)

        # --- GLOBAL KEY BINDING --- # <<< KORREKTUR 1
        # Bind the Enter key to the main window. This will trigger start_splitting
        # anytime, just like clicking the button.
        self.bind("<Return>", self.start_splitting)

        # --- Instance Variables ---
        self.pdf_path = ""
        self.output_dir = "pdf_output_split"

        # --- WIDGETS ---

        # 1. File Selection Frame (unverändert)
        self.file_frame = ctk.CTkFrame(self)
        self.file_frame.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")
        self.file_frame.grid_columnconfigure(0, weight=1)
        self.label_file = ctk.CTkLabel(self.file_frame, text="1. Select PDF File", font=ctk.CTkFont(size=14, weight="bold"))
        self.label_file.grid(row=0, column=0, columnspan=2, padx=10, pady=(10, 5), sticky="w")
        self.entry_file_path = ctk.CTkEntry(self.file_frame, placeholder_text="No file selected")
        self.entry_file_path.grid(row=1, column=0, padx=(10, 5), pady=10, sticky="ew")
        self.button_browse = ctk.CTkButton(self.file_frame, text="Browse...", width=100, command=self.select_file)
        self.button_browse.grid(row=1, column=1, padx=(5, 10), pady=10)

        # 2. Method Selection Frame (unverändert)
        self.method_frame = ctk.CTkFrame(self)
        self.method_frame.grid(row=1, column=0, padx=20, pady=10, sticky="ew")
        self.label_method = ctk.CTkLabel(self.method_frame, text="2. Choose Splitting Method", font=ctk.CTkFont(size=14, weight="bold"))
        self.label_method.grid(row=0, column=0, padx=10, pady=(10, 5), sticky="w")
        self.method_var = ctk.StringVar(value="REGEX")
        self.radio_regex = ctk.CTkRadioButton(self.method_frame, text="Regex Pattern", variable=self.method_var, value="REGEX", command=self.update_input_fields)
        self.radio_regex.grid(row=2, column=0, padx=20, pady=10, sticky="w")
        self.radio_toc = ctk.CTkRadioButton(self.method_frame, text="Table of Contents (ToC)", variable=self.method_var, value="TOC", command=self.update_input_fields)
        self.radio_toc.grid(row=1, column=0, padx=20, pady=10, sticky="w")
        self.radio_fixed = ctk.CTkRadioButton(self.method_frame, text="Fixed Page Count", variable=self.method_var, value="FIXED", command=self.update_input_fields)
        self.radio_fixed.grid(row=3, column=0, padx=20, pady=(10, 20), sticky="w")

        # 3. Dynamic Input Frame
        self.input_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.input_frame.grid(row=2, column=0, padx=20, pady=10, sticky="ew")
        self.input_frame.grid_columnconfigure(0, weight=1) # <<< KORREKTUR 2
        
        self.entry_regex = ctk.CTkEntry(self.input_frame, placeholder_text="Enter your Regex pattern here...")
        self.entry_pages = ctk.CTkEntry(self.input_frame, placeholder_text="e.g., 10")
        
        # Key bindings on widgets are no longer needed due to global binding
        # self.entry_regex.bind("<Return>", self.start_splitting) <-- REMOVED
        # self.entry_pages.bind("<Return>", self.start_splitting) <-- REMOVED

        # 4. Action Frame (unverändert)
        self.action_frame = ctk.CTkFrame(self)
        self.action_frame.grid(row=3, column=0, padx=20, pady=20, sticky="ew")
        self.action_frame.grid_columnconfigure(0, weight=1)
        self.button_start = ctk.CTkButton(self.action_frame, text="Start Splitting", font=ctk.CTkFont(size=16, weight="bold"), command=self.start_splitting)
        self.button_start.grid(row=0, column=0, padx=(10, 5), pady=10, ipady=10, sticky="ew")
        self.button_quit = ctk.CTkButton(self.action_frame, text="Quit", width=100, command=self.destroy, fg_color="#555555", hover_color="#444444")
        self.button_quit.grid(row=0, column=1, padx=(5, 10), pady=10, ipady=10)

        # 5. Status Bar (unverändert)
        self.status_label = ctk.CTkLabel(self, text="Ready. Please select a file.", text_color="gray")
        self.status_label.grid(row=4, column=0, padx=20, pady=(0, 10), sticky="w")
        
        self.update_input_fields() # Set initial state

    # --- METHODS ---

    def select_file(self):
        path = filedialog.askopenfilename(title="Select a PDF file", filetypes=(("PDF Files", "*.pdf"), ("All files", "*.*")))
        if path:
            self.pdf_path = path
            self.entry_file_path.delete(0, ctk.END)
            self.entry_file_path.insert(0, os.path.basename(path))
            self.status_label.configure(text=f"File selected: {os.path.basename(path)}", text_color="gray")

    def update_input_fields(self):
        """Shows/hides the correct input field using grid_remove."""
        method = self.method_var.get()
        
        # <<< KORREKTUR 3: Using grid_remove to completely hide widgets and collapse space
        self.entry_regex.grid_remove()
        self.entry_pages.grid_remove()
        
        if method == "REGEX":
            self.entry_regex.grid(row=0, column=0, sticky="ew")
        elif method == "FIXED":
            self.entry_pages.grid(row=0, column=0, sticky="ew")

    def start_splitting(self, event=None):
        """The main function called by the 'Start' button or global Enter key."""
        if not self.pdf_path:
            self.status_label.configure(text="Error: Please select a PDF file first.", text_color="orange")
            return
        
        self.status_label.configure(text="Processing...", text_color="gray")
        self.button_start.configure(state="disabled")
        self.button_quit.configure(state="disabled")
        self.update() 
        
        doc = None
        sections = None
        
        try:
            doc = fitz.open(self.pdf_path)
            method = self.method_var.get()

            if method == "TOC":
                sections = logic.discover_sections_by_toc(doc)
                if sections is None:
                    self.status_label.configure(text="Fallback: No ToC found. Please try another method.", text_color="yellow")
                    return 
            
            elif method == "REGEX":
                pattern = self.entry_regex.get()
                if not pattern:
                    self.status_label.configure(text="Error: Please provide a Regex pattern.", text_color="orange")
                    return
                sections = logic.discover_sections_by_regex(doc, pattern)
                if sections is None:
                    self.status_label.configure(text="Fallback: No text matched your Regex. Please check it.", text_color="yellow")
                    return

            elif method == "FIXED":
                try:
                    page_count = int(self.entry_pages.get())
                    if page_count <= 0: raise ValueError
                    sections = logic.discover_sections_by_fixed_pages(doc, page_count)
                except (ValueError, TypeError):
                    self.status_label.configure(text="Error: Please enter a valid positive number for pages.", text_color="orange")
                    return

            if sections:
                num_files = logic.process_and_save_sections(doc, sections, self.output_dir)
                self.status_label.configure(text=f"Success! Created {num_files} files in '{self.output_dir}' folder.", text_color="lightgreen")
            else:
                 self.status_label.configure(text="Error: Could not determine sections to split.", text_color="red")
        
        except Exception as e:
            self.status_label.configure(text=f"An unexpected error occurred: {e}", text_color="red")
        
        finally:
            if doc: doc.close()
            self.button_start.configure(state="normal")
            self.button_quit.configure(state="normal")

if __name__ == "__main__":
    app = App()
    app.mainloop()