import io
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter

class PDFService:
    def stamp_pdf(self, file_content: bytes, sig_id: str, stamps: list[dict], user_image: str | None = None) -> bytes:
        """
        Stamps the signature ID or user image onto the PDF at the given coordinates.
        stamps: list of dicts with keys 'page', 'x', 'y', 'type' ('digital' or 'user')
        """
        existing_pdf = PdfReader(io.BytesIO(file_content))
        output = PdfWriter()
        
        # Group stamps by page
        stamps_by_page = {}
        for stamp in stamps:
            p = stamp['page']
            if p not in stamps_by_page:
                stamps_by_page[p] = []
            stamps_by_page[p].append(stamp)

        # Loop through all pages
        for i in range(len(existing_pdf.pages)):
            page = existing_pdf.pages[i]
            page_num = i + 1
            
            if page_num in stamps_by_page:
                # Get page dimensions
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)
                
                # Create a new PDF with Reportlab for this page's stamps
                packet = io.BytesIO()
                c = canvas.Canvas(packet, pagesize=(page_width, page_height))
                
                for stamp in stamps_by_page[page_num]:
                    x = stamp['x']
                    y = stamp['y']
                    s_type = stamp.get('type', 'digital')
                    
                    print(f"Stamping {s_type} on Page {page_num} at x={x}, y={y}")
                    
                    if s_type == 'digital':
                        c.setStrokeColorRGB(0, 0.5, 0) # Green
                        c.setFillColorRGB(0, 0.5, 0)
                        c.rect(x, y, 150, 30, fill=0) # Draw a box
                        c.drawString(x + 10, y + 10, f"Signed: {sig_id}")
                    
                    elif s_type == 'user' and user_image:
                        try:
                            # Decode base64 image
                            img_str = user_image
                            if "base64," in img_str:
                                img_str = img_str.split("base64,")[1]
                            
                            img_data = base64.b64decode(img_str)
                            img = ImageReader(io.BytesIO(img_data))
                            
                            # Calculate dimensions (max width 150)
                            iw, ih = img.getSize()
                            aspect = ih / float(iw)
                            width = 150
                            height = width * aspect
                            
                            # Draw image (y is bottom-left, so we might need to adjust if y was top-left in frontend)
                            # Frontend sends PDF coordinates (bottom-left origin), so x,y are correct bottom-left of image
                            c.drawImage(img, x, y, width=width, height=height, mask='auto')
                        except Exception as e:
                            print(f"Failed to draw user image: {e}")
                
                c.save()
                
                # Merge
                packet.seek(0)
                stamp_pdf = PdfReader(packet)
                page.merge_page(stamp_pdf.pages[0])
            
            output.add_page(page)
            
        # Write the output
        output_stream = io.BytesIO()
        output.write(output_stream)
        return output_stream.getvalue()

pdf_service = PDFService()
