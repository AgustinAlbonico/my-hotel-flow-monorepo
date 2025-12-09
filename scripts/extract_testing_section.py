import PyPDF2
import re

pdf_path = r"c:\Users\AgustinNotebook\Downloads\Di Domenico Nicolás Alejandro - Trabajo de Diploma.docx (1).pdf"

try:
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        total_pages = len(pdf_reader.pages)
        
        print("Buscando sección de Pruebas de Software...\n")
        print("="*100)
        
        # Extraer páginas relevantes (104-108 basándose en el índice)
        testing_pages = range(103, 114)  # páginas 104-114 (índice 103-113)
        
        full_content = ""
        for page_num in testing_pages:
            if page_num < total_pages:
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                print(f"\n{'='*100}")
                print(f"PÁGINA {page_num + 1}")
                print('='*100)
                print(text)
                full_content += f"\n\n--- PÁGINA {page_num + 1} ---\n\n{text}"
        
        # Guardar el contenido en un archivo de texto para análisis más fácil
        output_file = r"c:\Users\AgustinNotebook\Desktop\Proyectos\myhotelflow\My hotel flow codigo\scripts\anexo_pruebas_extraido.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        print("\n\n" + "="*100)
        print(f"Contenido guardado en: {output_file}")
        print("="*100)
        
        # Análisis de estructura
        print("\n\nANÁLISIS DE ESTRUCTURA:")
        print("="*100)
        
        # Buscar patrones de secciones numeradas
        secciones = re.findall(r'^\d+\.\d*\.?\s+[A-ZÁÉÍÓÚÑ][^\n]{5,80}', full_content, re.MULTILINE)
        print(f"\n1. SECCIONES NUMERADAS ENCONTRADAS ({len(secciones)}):")
        for i, seccion in enumerate(secciones, 1):
            print(f"   {i}. {seccion.strip()}")
        
        # Buscar tablas
        print(f"\n2. ELEMENTOS DE TABLAS:")
        tabla_keywords = re.findall(r'(Tabla|Cuadro|ID|Estado|Resultado esperado|Casos de prueba)', full_content)
        print(f"   Referencias a tablas/estructuras: {len(tabla_keywords)}")
        
        # Buscar figuras/grafos
        print(f"\n3. ELEMENTOS VISUALES:")
        visual_keywords = re.findall(r'(Figura|Gráfico|Grafo|Diagrama|Complejidad ciclomática)', full_content)
        print(f"   Referencias visuales: {len(visual_keywords)}")
        
        # Buscar métodos de prueba
        print(f"\n4. MÉTODOS DE PRUEBA MENCIONADOS:")
        if 'Caja Negra' in full_content or 'caja negra' in full_content:
            print("   ✓ Pruebas de Caja Negra")
        if 'Caja Blanca' in full_content or 'caja blanca' in full_content:
            print("   ✓ Pruebas de Caja Blanca")
        if 'Ruta Básica' in full_content or 'ruta básica' in full_content:
            print("   ✓ Pruebas de Ruta Básica")
        if 'V(G)' in full_content or 'Complejidad' in full_content:
            print("   ✓ Análisis de Complejidad Ciclomática")
        
        # Buscar código
        print(f"\n5. ELEMENTOS DE CÓDIGO:")
        code_patterns = len(re.findall(r'(Código:|Método:|return|if|else)', full_content))
        print(f"   Referencias a código fuente: {code_patterns}")
        
        # Buscar casos de prueba
        print(f"\n6. CASOS DE PRUEBA:")
        casos = re.findall(r'(Caso de prueba|Test Case|CP-?\d+|TC-?\d+)', full_content, re.IGNORECASE)
        print(f"   Menciones de casos de prueba: {len(casos)}")
        
        print("\n" + "="*100)
        
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
