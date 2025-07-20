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

We use the latest anthropic API model Claude Sonnet 4. It has a optimal balance of intelligence, cost, and speed. See the image in ``../anthropic-latest-models-pricing.png`` for the costs at the time of execution.
- with batch processing the price trops by 50%, but our workflow isn't using it. Because other models dont support batch processing and we would not depend on a single model. Our gole is that you can use any model of our chose for de extraction and validation.
