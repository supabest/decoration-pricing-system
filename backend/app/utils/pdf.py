"""PDF 生成工具"""
from typing import Dict
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def generate_quotation(project_name: str, data: Dict, output_path: str):
    """生成报价单 PDF"""
    c = canvas.Canvas(output_path, pagesize=A4)
    c.drawString(100, 800, f"报价单 — {project_name}")
    c.save()
