import { exec } from "https://deno.land/x/exec/mod.ts";

async function combineAudioFiles(filePaths: string[], outputFilePath: string): Promise<void> {
  const listFilePath = 'fileList.txt';
  const fileListContent = filePaths.map(path => `file '${path}'`).join('\n');
  
  await Deno.writeTextFile(listFilePath, fileListContent);

  const ffmpegCommand = `ffmpeg -f concat -safe 0 -i ${listFilePath} -c copy ${outputFilePath}`;
  const { status, output } = await exec(ffmpegCommand);

  if (!status.success) {
    console.error('FFmpeg failed:', new TextDecoder().decode(output));
    throw new Error('Failed to combine audio files');
  }

  await Deno.remove(listFilePath);
}
