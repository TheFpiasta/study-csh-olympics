# Python helper to chunk pdfs

## installation

install python 3 on your system

create a virtual environment and install required packages:

```bash
python -m venv .venv
# activate the virtual environment on windows:
# . .venv\Scripts\activate
# or on linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

## update requirements.txt

To update the `requirements.txt` file with the currently installed packages, run:

```bash
pip freeze > requirements.txt
```

## Note:
For the regex chunker solution it is recommented to remove the first and last pages of the pdf, that have no needed information.

We use the workflow "OnePdfToJson".
