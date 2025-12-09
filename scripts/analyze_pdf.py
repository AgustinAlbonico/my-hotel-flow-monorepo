import PyPDF2
import re
import sys

pdf_path = r"c:\Users\AgustinNotebook\Downloads\Di Domenico Nicolás Alejandro - Trabajo de Diploma.docx (1).pdf"

try:
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        total_pages = len(pdf_reader.pages)
        
        print(f"Total de páginas: {total_pages}\n")
        print("="*80)
        
        # Buscar el Anexo 9 o sección de Pruebas de Software
        anexo_found = False
        anexo_start_page = -1
        anexo_content = []
        
        for page_num in range(total_pages):
            page = pdf_reader.pages[page_num]
            text = page.extract_text()
            
            # Buscar diferentes variantes del título
            if re.search(r'(Anexo\s*9|ANEXO\s*9|Anexo\s*IX).*?(Pruebas|PRUEBAS|Software|SOFTWARE)', text, re.IGNORECASE):
                anexo_found = True
                anexo_start_page = page_num
                print(f"\n*** ANEXO 9 ENCONTRADO EN LA PÁGINA {page_num + 1} ***\n")
                print("="*80)
            
            # Si encontramos el anexo, extraer contenido hasta el siguiente anexo
            if anexo_found:
                # Verificar si llegamos al siguiente anexo
                if anexo_start_page != page_num and re.search(r'(Anexo\s*10|ANEXO\s*10|Anexo\s*X[^I])', text, re.IGNORECASE):
                    print(f"\n*** FIN DEL ANEXO 9 EN LA PÁGINA {page_num} ***\n")
                    break
                
                anexo_content.append(f"\n--- PÁGINA {page_num + 1} ---\n")
                anexo_content.append(text)
        
        if not anexo_found:
            print("No se encontró el Anexo 9. Buscando secciones relacionadas con 'Pruebas'...\n")
            
            # Búsqueda más amplia
            for page_num in range(total_pages):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                
                if re.search(r'(Pruebas\s+de\s+Software|Testing|Casos\s+de\s+Prueba|Plan\s+de\s+Pruebas)', text, re.IGNORECASE):
                    print(f"\n*** SECCIÓN RELACIONADA ENCONTRADA EN PÁGINA {page_num + 1} ***")
                    print("="*80)
                    print(text[:500])
                    print("\n...\n")
        
        # Imprimir contenido completo del Anexo 9
        if anexo_content:
            print("\n" + "="*80)
            print("CONTENIDO COMPLETO DEL ANEXO 9:")
            print("="*80 + "\n")
            for content in anexo_content:
                print(content)
        
        # Análisis de estructura
        if anexo_content:
            full_text = ''.join(anexo_content)
            print("\n" + "="*80)
            print("ANÁLISIS DE ESTRUCTURA:")
            print("="*80 + "\n")
            
            # Buscar tablas
            tabla_count = len(re.findall(r'Tabla|Table|Cuadro', full_text, re.IGNORECASE))
            print(f"Posibles tablas encontradas: {tabla_count}")
            
            # Buscar figuras/gráficos
            figura_count = len(re.findall(r'Figura|Figure|Gráfico|Grafo', full_text, re.IGNORECASE))
            print(f"Posibles figuras/gráficos encontrados: {figura_count}")
            
            # Buscar casos de prueba
            casos_count = len(re.findall(r'Caso\s+de\s+prueba|Test\s+Case|CP-\d+|TC-\d+', full_text, re.IGNORECASE))
            print(f"Posibles casos de prueba mencionados: {casos_count}")
            
            # Buscar secciones
            print("\nSecciones identificadas:")
            secciones = re.findall(r'^\d+\.\d*\.?\s+[A-ZÁÉÍÓÚ][^\n]{10,60}', full_text, re.MULTILINE)
            for seccion in secciones[:10]:  # Primeras 10 secciones
                print(f"  - {seccion.strip()}")
            
            print(f"\n\nTotal de caracteres en el Anexo 9: {len(full_text)}")
            print(f"Total de páginas del Anexo 9: {len(anexo_content)}")

except FileNotFoundError:
    print(f"Error: No se encontró el archivo en {pdf_path}")
except Exception as e:
    print(f"Error al procesar el PDF: {str(e)}")
    import traceback
    traceback.print_exc()
