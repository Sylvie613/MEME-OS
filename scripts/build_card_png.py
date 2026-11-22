import base64
import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "cards" / "MEME-OS-alpha.json"
PNG_PATH = ROOT / "cards" / "MEME-OS-alpha.png"

def chunk(kind: bytes, data: bytes) -> bytes:
    payload = kind + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)

def make_cover(width=512, height=768):
    # Soft lavender/ice background with a simple dark silhouette-like center mark.
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            t = y / max(1, height - 1)
            r = int(246 - 12 * t)
            g = int(244 - 8 * t)
            b = int(252 - 2 * t)
            # central dark oval + small head, deliberately generic
            cx, cy = width / 2, height * 0.48
            body = ((x-cx)/(width*0.22))**2 + ((y-cy)/(height*0.22))**2 < 1
            head = ((x-cx)/(width*0.09))**2 + ((y-height*0.27)/(height*0.06))**2 < 1
            if body or head:
                r, g, b = 42, 35, 51
            row.extend((r,g,b))
        rows.append(bytes(row))
    return b"".join(rows)

def main():
    card = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    compact = json.dumps(card, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    chara = base64.b64encode(compact)

    width, height = 512, 768
    raw = make_cover(width, height)
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"tEXt", b"chara\x00" + chara)
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    PNG_PATH.write_bytes(png)
    print(f"Wrote {PNG_PATH} ({len(png)} bytes)")

if __name__ == "__main__":
    main()
