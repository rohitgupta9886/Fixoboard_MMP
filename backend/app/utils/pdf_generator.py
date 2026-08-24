import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


def generate_dispatch_pdf(dispatch_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    story = []

    styles = getSampleStyleSheet()
    
    brand_title_style = ParagraphStyle(
        'DocBrandTitle',
        parent=styles['Heading1'],
        fontSize=17,
        leading=21,
        textColor=colors.HexColor('#1E3A8A'),
        fontName="Helvetica-Bold",
        alignment=1, # Center
    )
    doc_type_style = ParagraphStyle(
        'DocTypeTitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0F172A'),
        fontName="Helvetica-Bold",
        alignment=1,
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#64748B'),
        alignment=1,
    )
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading3'],
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        fontName="Helvetica-Bold",
    )
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#334155'),
    )
    cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor('#0F172A'),
    )
    header_cell = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        fontName="Helvetica-Bold",
        textColor=colors.white,
    )

    # Top Brand Header
    story.append(Paragraph("FIXOBOARD MANUFACTURING MANAGEMENT SYSTEM", brand_title_style))
    story.append(Paragraph("OFFICIAL DISPATCH CLEARANCE SHEET &amp; VEHICLE GATE PASS", doc_type_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%d-%b-%Y %H:%M:%S')} • ISO 9001:2015 Manufacturing Standards", subtitle_style))
    story.append(Spacer(1, 14))

    # Meta Table (Dispatch No, Date, Vehicle, Driver, Party, Order)
    meta_info = [
        [
            Paragraph("<b>Dispatch Number:</b>", cell_bold), Paragraph(f"<font color='#0284C7'><b>{dispatch_data.get('dispatch_number', '')}</b></font>", cell_style),
            Paragraph("<b>Dispatch Date:</b>", cell_bold), Paragraph(str(dispatch_data.get("dispatch_date", "")), cell_style),
        ],
        [
            Paragraph("<b>Customer (Consignee):</b>", cell_bold), Paragraph(f"<b>{dispatch_data.get('party_name', '')}</b>", cell_style),
            Paragraph("<b>Sales Order Ref:</b>", cell_bold), Paragraph(str(dispatch_data.get("order_number", "")), cell_style),
        ],
        [
            Paragraph("<b>Vehicle Number:</b>", cell_bold), Paragraph(f"<font color='#1E293B'><b>{dispatch_data.get('vehicle_number', '')}</b></font>", cell_style),
            Paragraph("<b>Driver &amp; Phone:</b>", cell_bold), Paragraph(f"{dispatch_data.get('driver_name', '')} ({dispatch_data.get('driver_phone', 'N/A')})", cell_style),
        ],
        [
            Paragraph("<b>Transporter Carrier:</b>", cell_bold), Paragraph(str(dispatch_data.get("transporter", "") or "Direct Courier"), cell_style),
            Paragraph("<b>LR / Bilty Number:</b>", cell_bold), Paragraph(str(dispatch_data.get("lr_number", "") or "N/A"), cell_style),
        ],
    ]
    
    meta_table = Table(meta_info, colWidths=[115, 155, 115, 155])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # Items Table
    story.append(Paragraph("DISPATCHED FINISHED GOODS &amp; SPECIFICATION BREAKDOWN", section_style))
    story.append(Spacer(1, 5))

    items_data = [
        [
            Paragraph("#", header_cell),
            Paragraph("Product Name", header_cell),
            Paragraph("Thickness", header_cell),
            Paragraph("Density", header_cell),
            Paragraph("Packing Mode", header_cell),
            Paragraph("Bundles", header_cell),
            Paragraph("Dispatched Qty", header_cell),
        ]
    ]

    total_sheets = 0
    total_packages = 0

    for idx, item in enumerate(dispatch_data.get("items", []), start=1):
        qty = int(float(str(item.get('dispatched_quantity', 0) or 0)))
        pkgs = int(float(str(item.get('package_count', 0) or 0)))
        total_sheets += qty
        total_packages += pkgs

        items_data.append([
            Paragraph(str(idx), cell_style),
            Paragraph(f"<b>{item.get('product_name', '')}</b>", cell_style),
            Paragraph(str(item.get("thickness", "")), cell_style),
            Paragraph(str(item.get("density", "")), cell_style),
            Paragraph(str(item.get("packing_mode", "") or "Standard"), cell_style),
            Paragraph(f"{pkgs} Crates", cell_style),
            Paragraph(f"<b>{qty} {item.get('unit', 'Sheets')}</b>", cell_bold),
        ])

    # Total row
    items_data.append([
        Paragraph("<b>TOTAL</b>", cell_bold),
        Paragraph("<b>Verified Cargo Load</b>", cell_bold),
        Paragraph("", cell_style),
        Paragraph("", cell_style),
        Paragraph("", cell_style),
        Paragraph(f"<b>{total_packages} Bundles</b>", cell_bold),
        Paragraph(f"<b>{total_sheets} Sheets</b>", cell_bold),
    ])

    items_table = Table(items_data, colWidths=[25, 145, 65, 65, 85, 65, 90])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, colors.HexColor('#F8FAFC')]),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#E2E8F0')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 24))

    # Signatures & Clearances Section
    sig_data = [
        [
            Paragraph("<b>1. Prepared By (Dispatch Lead)</b>", cell_style),
            Paragraph("<b>2. Security Clearance (Gate Out)</b>", cell_style),
            Paragraph("<b>3. Driver Receipt &amp; Handover</b>", cell_style),
        ],
        [
            Paragraph("<br/><br/>Sign: ____________________<br/>Date: ____________________", cell_style),
            Paragraph("<br/><br/>Sign: ____________________<br/>Time: ____________________", cell_style),
            Paragraph("<br/><br/>Sign: ____________________<br/>Name: ____________________", cell_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[180, 180, 180])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(sig_table)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

