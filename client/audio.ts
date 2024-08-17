import * as Tone from 'https://esm.sh/tone@next'

let audioContext: AudioContext | null = null
export function initializeAudioContext(): void {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)
        console.log('AudioContext initialized')
    }
}

export function playNote(): void {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C4", "8n");
}

// export function sayHello(): void {
//     console.log('Hello')
//     return 'Hello'
//     //create a synth and connect it to the main output (your speakers)
    
// }