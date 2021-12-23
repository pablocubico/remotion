import {interpolate} from 'remotion'
import {useEffect, useState} from 'react';
import {Audio, Sequence, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import * as Tone from 'tone';

export const ToneJS: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender());
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const { fps } = useVideoConfig();

  const audioDurationInFrames = 300;
  const lengthInSeconds = audioDurationInFrames / fps;

  const sequenceStartOffset = 100;

  const notesSequence = [
    { note: 'C4', duration: '4n' },
    { note: 'Eb4', duration: '4n' },
    { note: 'G4', duration: '4n' },
    { note: 'A4', duration: '4n' },
  ];

  // Just making it something different than 120 o 60...
  Tone.Transport.bpm.value = 150;

  const renderAudio = async () => {
    const toneBuffer = await Tone.Offline(() => {
      const synth = new Tone.Synth().toDestination();
      const now = Tone.now();
      let accumulatedTime = 0;
      notesSequence.map((sequenceItem, i) => {
        accumulatedTime += Tone.Time(sequenceItem.duration).toSeconds();
        synth.triggerAttackRelease(sequenceItem.note, sequenceItem.duration, now + accumulatedTime)
      })
    }, lengthInSeconds);

    const buffer = toneBuffer.get() || null;
    setAudioBuffer(buffer);

    continueRender(handle);
  };

  useEffect(() => {
    renderAudio();
  }, []);

  let accumulatedFrames = 0;
  const sequenceWithFrames = notesSequence.map((sequenceItem, i) => {
    accumulatedFrames += Tone.Time(sequenceItem.duration).toSeconds() * fps;
    return {
      note: sequenceItem.note,
      midiNote: Tone.Midi(sequenceItem.note).toMidi(),
      frame: accumulatedFrames
    }
  });

  return (
    <>
      {
        sequenceWithFrames.map(
          (sequenceItem, i) => {
            const sequenceBox = (
              <div
                key={i} style={{
                  background: '#884475',
                  margin: '20px',
                  fontSize: 50,
                  display: 'inline-block',
                  color: 'white',
                  width: '150px',
                  height: '150px',
                  borderRadius: '150px',
                  lineHeight: '150px',
                  textAlign: 'center',
                }}
              >
                {sequenceItem.note}
              </div>
            );

            return frame > sequenceItem.frame + sequenceStartOffset
              ? sequenceBox
              : null;
          }
        )
      }
      <div
        style={{
        fontFamily: 'Helvetica, Arial',
        fontSize: 50,
        background: '#DC136C',
        color: 'white',
        textAlign: 'center',
        position: 'absolute',
        bottom: 50,
        zIndex: 99999,
        padding: '20px',
        width: '100%'
        }}
      >
        {
          audioBuffer &&
          <Sequence from={sequenceStartOffset} durationInFrames={100}>
            <Audio
              audioBuffer={audioBuffer}
              startFrom={0}
              endAt={100}
              volume={(f) =>
                interpolate(f, [0, 50, 100], [0, 1, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })
              }
            />
          </Sequence>
        }
        Render sound from offline audio buffer
      </div>
    </>
  );
};

export default ToneJS;
