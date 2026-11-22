import base64
import copy
import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "cards" / "MEME-OS-alpha.json"
AVATAR_B64_PATH = ROOT / "cards" / "MEME-OS-avatar.b64"
PNG_PATH = ROOT / "cards" / "MEME-OS-alpha.png"

PNG_SIG = b"\x89PNG\r\n\x1a\n"
DROP_TEXT_KEYS = {b"chara", b"ccv3", b"M\xc3\x89M\xc3\x89-OS-Version", b"M\xc3\x89M\xc3\x89-OS-Min-Extension"}


def chunk(kind: bytes, data: bytes) -> bytes:
    payload = kind + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)


def text_chunk(key: str, value: str) -> bytes:
    return chunk(b"tEXt", key.encode("utf-8") + b"\x00" + value.encode("ascii"))


def inject_text_chunks(base_png: bytes, additions: list[bytes]) -> bytes:
    if not base_png.startswith(PNG_SIG):
        raise ValueError("Avatar source is not a PNG")
    out = bytearray(PNG_SIG)
    pos = len(PNG_SIG)
    inserted = False
    while pos < len(base_png):
        length = struct.unpack(">I", base_png[pos:pos + 4])[0]
        kind = base_png[pos + 4:pos + 8]
        end = pos + 12 + length
        raw_chunk = base_png[pos:end]
        data = base_png[pos + 8:pos + 8 + length]

        if kind == b"IEND" and not inserted:
            for extra in additions:
                out += extra
            inserted = True

        keep = True
        if kind == b"tEXt" and b"\x00" in data:
            key = data.split(b"\x00", 1)[0]
            if key in DROP_TEXT_KEYS:
                keep = False
        if keep:
            out += raw_chunk
        pos = end

    if not inserted:
        raise ValueError("PNG had no IEND chunk")
    return bytes(out)


def main():
    card_v2 = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    card_v3 = copy.deepcopy(card_v2)
    card_v3["spec"] = "chara_card_v3"
    card_v3["spec_version"] = "3.0"

    compact_v2 = json.dumps(card_v2, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    compact_v3 = json.dumps(card_v3, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    chara = base64.b64encode(compact_v2).decode("ascii")
    ccv3 = base64.b64encode(compact_v3).decode("ascii")

    avatar_png = base64.b64decode(AVATAR_B64_PATH.read_text(encoding="ascii").strip())
    final_png = inject_text_chunks(
        avatar_png,
        [
            text_chunk("chara", chara),
            text_chunk("ccv3", ccv3),
            text_chunk("MÉMÉ-OS-Version", "0.3.7-alpha"),
            text_chunk("MÉMÉ-OS-Min-Extension", "0.10.6"),
        ],
    )
    PNG_PATH.write_bytes(final_png)
    print(f"Wrote {PNG_PATH} ({len(final_png)} bytes)")


if __name__ == "__main__":
    main()
