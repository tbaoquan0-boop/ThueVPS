# -*- coding: utf-8 -*-
"""
Test script for table formatting and code blocks in python-docx
"""
import docx
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

doc = docx.Document()

# Test table styling
tbl = doc.add_table(rows=2, cols=4)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
for r in tbl.rows:
    for c in r.cells:
        c.paragraphs[0].text = "Test"

doc.save("test_tbl.docx")
print("Table test passed!")
