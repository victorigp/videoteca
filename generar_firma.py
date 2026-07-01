import os
import glob
from PIL import Image, ImageDraw, ImageChops

def obtener_ultimo_post(directorio_posts="_posts"):
    # Busca todos los archivos .md y .markdown en la carpeta de Jekyll
    archivos = glob.glob(os.path.join(directorio_posts, "*.md"))
    archivos.extend(glob.glob(os.path.join(directorio_posts, "*.markdown")))
    if not archivos:
        return None
    # Devuelve el archivo modificado más recientemente
    return max(archivos, key=os.path.getmtime)

def extraer_datos_frontmatter(ruta_archivo):
    # Lee el Markdown y extrae el YAML del principio manualmente (evita depender de pyyaml)
    datos = {}
    with open(ruta_archivo, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    if contenido.startswith('---'):
        fin_yaml = contenido.find('---', 3)
        if fin_yaml != -1:
            yaml_str = contenido[3:fin_yaml]
            for linea in yaml_str.splitlines():
                linea = linea.strip()
                if not linea or linea.startswith('#'):
                    continue
                if ':' in linea:
                    clave, valor = linea.split(':', 1)
                    clave = clave.strip()
                    # Limpiar comentarios en la misma línea y comillas
                    valor = valor.split(' #', 1)[0].strip()
                    valor = valor.strip("'").strip('"')
                    
                    if clave == 'thumbnail':
                        datos['thumbnail'] = valor
                    elif clave == 'sello':
                        datos['sello'] = (valor.lower() == 'true')
    return datos

def main():

    
    ultimo_post = obtener_ultimo_post()
    if not ultimo_post:
        print("No se encontraron posts.")
        return

    print(f"📄 Analizando: {ultimo_post}")
    datos = extraer_datos_frontmatter(ultimo_post)

    thumbnail_relativo = datos.get('thumbnail')
    lleva_sello = datos.get('sello', False)

    if not thumbnail_relativo:
        print("❌ El post no tiene thumbnail definido.")
        return

    # Quita la primera barra si existe para evitar problemas de rutas relativas
    if thumbnail_relativo.startswith('/'):
        thumbnail_relativo = thumbnail_relativo[1:]

    # --- LÓGICA DE IMAGEN (Igual que antes pero automática) ---
    try:
        base = Image.open(thumbnail_relativo).convert("RGBA")
        
        # Redondear las esquinas derechas (simulando el borde derecho de la tarjeta)
        radio = int(base.width * 0.03)  # Radio proporcional al tamaño original
        mask = Image.new("L", base.size, 0)
        draw = ImageDraw.Draw(mask)
        w, h = base.size
        # Rectángulo izquierdo (esquinas rectas)
        draw.rectangle([0, 0, w - radio, h], fill=255)
        # Rectángulo derecho central
        draw.rectangle([w - radio, radio, w, h - radio], fill=255)
        # Curva superior derecha
        draw.pieslice([w - 2*radio, 0, w, 2*radio], 270, 360, fill=255)
        # Curva inferior derecha
        draw.pieslice([w - 2*radio, h - 2*radio, w, h], 0, 90, fill=255)
        
        # Mezclar con la transparencia original por si acaso
        alpha_orig = base.split()[3]
        mask = ImageChops.darker(mask, alpha_orig)
        base.putalpha(mask)
        
        if lleva_sello:
            sello = Image.open(os.path.join("assets", "img", "recomiendo.png")).convert("RGBA")
            
            # Se calcula el factor de escala asumiendo que en la web el contenedor mide aprox 450px
            escala = base.width / 450.0
            
            # Se hace el doble de grande
            w_sello = int(150 * escala * 1.4)
            h_sello = int(98 * escala * 1.4)
            
            resampling = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.ANTIALIAS
            sello = sello.resize((w_sello, h_sello), resampling)
            sello_rot = sello.rotate(15, expand=True)
            
            # Se escala también la posición relativa (bottom: 5px, right: -5px)
            offset_y = 5 * escala
            offset_x = -5 * escala
            
            x_center = base.width - offset_x - (w_sello / 2)
            y_center = base.height - offset_y - (h_sello / 2)
            
            px = int(x_center - (sello_rot.width / 2))
            py = int(y_center - (sello_rot.height / 2))
            
            # Se ajusta el lienzo para evitar recortes
            min_x = min(0, px)
            min_y = min(0, py)
            max_x = max(base.width, px + sello_rot.width)
            max_y = max(base.height, py + sello_rot.height)
            
            lienzo = Image.new('RGBA', (max_x - min_x, max_y - min_y), (255, 255, 255, 0))
            lienzo.paste(base, (-min_x, -min_y))
            lienzo.paste(sello_rot, (px - min_x, py - min_y), mask=sello_rot)
            
            final_img = lienzo
            print("✅ Sello 'Se lo recomiendo' aplicado.")
        else:
            final_img = base
            print("ℹ️ Post normal, sin sello.")

        # Se reduce al tamaño pequeño de Gmail (aprox. 200px)
        resampling = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.ANTIALIAS
        final_img.thumbnail((250, 250), resampling)

        # Guardar en el escritorio (ejemplo para Windows)
        ruta_salida = os.path.join(os.path.expanduser("~"), "Desktop", "firma_gmail.png")
        final_img.save(ruta_salida, format="PNG")
        print(f"🎉 Imagen final guardada en: {ruta_salida}")

    except Exception as e:
        print(f"Error procesando la imagen: {e}")

if __name__ == "__main__":
    main()