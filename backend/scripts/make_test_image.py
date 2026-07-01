"""Write a small PNG for e2e upload tests."""
from pathlib import Path

# Minimal valid 64x64 PNG (solid dark pixel block)
import struct
import zlib

OUT = Path(__file__).resolve().parent / "test-photo.png"
W, H = 64, 64


def chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


raw = b"".join(
    b"\x00" + bytes([0, 0, 0]) * W
    for _ in range(H)
)
compressed = zlib.compress(raw, 9)

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
png += chunk(b"IDAT", compressed)
png += chunk(b"IEND", b"")

OUT.write_bytes(png)
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
