import os
from PIL import Image
import statistics

frames_dir = r"C:\Users\WQZS6\Desktop\personal-site\frames2"
for fname in sorted(os.listdir(frames_dir)):
    if not fname.endswith('.png'): continue
    img = Image.open(os.path.join(frames_dir, fname))
    w, h = img.size
    small = img.resize((10, 10))
    px = list(small.getdata())
    dark = sum(1 for p in px if sum(p[:3]) < 200)
    light = sum(1 for p in px if sum(p[:3]) > 500)
    c = img.crop((w//4, h//3, 3*w//4, 2*h//3)).resize((5, 5))
    cb = statistics.mean(sum(p[:3]) for p in list(c.getdata()))
    print(f'{fname}: size={w}x{h} dark={dark}% light={light}% center_bright={int(cb)}')
