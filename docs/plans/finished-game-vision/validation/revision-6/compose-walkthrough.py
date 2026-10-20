"""Arrange native concept screenshots for conversation display; requires Pillow."""
from pathlib import Path
import sys
from PIL import Image,ImageDraw,ImageFont
root=Path(sys.argv[1])
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
for name,panels in [
 ('choose-and-attack',[('04-source','Choose your source'),('05-target','Compare legal targets')]),
 ('loss-and-capture',[('08-loss','Read a loss'),('10-capture','Preview the move-in')]),
 ('opponent-and-return',[('15-computer','Follow opponents'),('16-return','Recover what changed')]),
 ('pending-and-help',[('11-fold','Resume a pending choice'),('19-help','Request help and names')]),
]:
    canvas=Image.new('RGB',(816,908),'#0b202b'); draw=ImageDraw.Draw(canvas)
    for column,(source,label) in enumerate(panels):
        draw.text((12+402*column,17),label,font=font,fill='#f0f1de')
        canvas.paste(Image.open(root/(source+'.png')).convert('RGB'),(12+402*column,52))
    canvas.save(root/(name+'.png'))
print('Wrote four native-size concept pairs')
