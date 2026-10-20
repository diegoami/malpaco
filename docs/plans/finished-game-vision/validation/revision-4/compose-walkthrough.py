"""Pair native rendered walkthrough PNGs for inline review; requires Pillow.
No product assets are changed. Input/output directory is the sole argument.
"""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

root=Path(sys.argv[1])
labels=['Start a match','Place armies','Start combat','Choose and attack',
        'Read the result','Move into captured land','End your turn','Receive a card']
names=['01-start','02-place','03-combat','04-attack','05-outcome','06-capture','07-end','08-reward']
font=next((Path(p) for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                            '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'] if Path(p).exists()),None)
face=ImageFont.truetype(str(font),21) if font else ImageFont.load_default()
for pair in range(4):
    canvas=Image.new('RGB',(816,908),'#0b202b')
    draw=ImageDraw.Draw(canvas)
    for column in range(2):
        i=2*pair+column
        draw.text((12+402*column,17),f'{i+1}. {labels[i]}',font=face,fill='#f0f1de')
        canvas.paste(Image.open(root/(names[i]+'.png')).convert('RGB'),(12+402*column,52))
    canvas.save(root/f'walkthrough-pair-{pair+1}.png')
print('Wrote four native-size review pairs.')
