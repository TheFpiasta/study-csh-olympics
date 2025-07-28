Failed attempts:

# Parsing the PDFs


## PDF to markdown

The goal of this was to use different python librarys to transform/translate the PDFs we are using as our source into markdown files to make them more computer readable.
For this we tried several approaches:

### MarkItDown

https://github.com/microsoft/markitdown
The created file did not contain any markdown syntax whatsoever, only the text of the PDF in weird spacing. Tables were written as consecutive entries with a wild mix of table headers, data and others all in random order (as it would seem at least).
Other librarys such as pdf2md or Pandoc had similar results. Thus this idea was discontinued.

### PDF-Plumber & GPT

This would first chunk the file into smaller pieces and then have GPT transform these chunks into json files containing the most important information. 
However, the PDF-Plumber created 852 chunks from the ~300 page PDF, which would all have been send to GPT for parsing. This would have been too big an investment for the results to be justified. Thus this was discontinued.