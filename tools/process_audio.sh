#!/bin/sh
# Prepara musica ed effetti dai file originali (cartelle */audio/src) con ffmpeg: volume uniforme, mp3 leggeri.
set -e
cd "$(dirname "$0")/.."
music() { ffmpeg -v error -y -i "$1" -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ac 2 -ar 44100 -b:a 96k "$2"; }
sfx() { ffmpeg -v error -y -ss "$2" -t "$3" -i "$1" -af "afade=t=in:d=0.005,afade=t=out:st=$(echo "$3 - 0.08" | bc | sed "s|^\.|0.|"):d=0.08,loudnorm=I=-14:TP=-1" -ac 1 -ar 44100 -b:a 96k "$4"; }
P=polvere-e-piombo/audio
music $P/src/m1.mp3 $P/m1.mp3
music $P/src/m2.ogg $P/m2.mp3
sfx $P/src/gunshot.ogg 0.10 0.45 $P/gunshot.mp3
sfx $P/src/explosion.ogg 0 2.2 $P/explosion.mp3
sfx $P/src/horse.ogg 0 2.2 $P/horse.mp3
R=presagio/audio
music $R/src/m1.mp3 $R/m1.mp3
music $R/src/m2.mp3 $R/m2.mp3
G=gattomina/audio
music $G/src/m1.mp3 $G/m1.mp3
music $G/src/m2.mp3 $G/m2.mp3
sfx $G/src/meow.ogg 0 0.78 $G/meow.mp3
sfx $G/src/meow2.oga 3.6 1.0 $G/meow2.mp3
sfx $G/src/meow2.oga 10.15 0.95 $G/meow3.mp3
sfx $G/src/purr.ogg 1.4 2.4 $G/purr.mp3
sfx $G/src/hiss.wav 0.85 1.4 $G/hiss.mp3
sfx $G/src/explosion.ogg 0 2.2 $G/explosion.mp3
