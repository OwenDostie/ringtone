<template>
  <div class="song-browser">
    <h1>past ringtone games:</h1>
    <ul class="folder-list">
      <li 
        v-for="folder in gameFolders" 
        :key="folder" 
        @click="toggleGameFolder(folder)" 
        :class="{ selected: folder === selectedGameFolder }"
      >
        {{ folder }}
      </li>
    </ul>

    <div v-if="selectedGameFolder">
      <h2>looking at game: {{ selectedGameFolder }}</h2>
      <h3>songs:</h3>
      <ul class="song-list">
        <li 
          v-for="song in songs" 
          :key="song" 
          @click="toggleSongFolder(song)" 
          :class="{ selected: song === selectedSong }"
        >
          {{ song }}
        </li>
        <div v-if="expandedSongFolder === selectedSong" class="clip-list">
          <h4>clips for {{ selectedSong }}:</h4>
          <ul>
            <li v-for="clip in clips" :key="clip.name">
              <div> {{ clip.name }}</div>
              <audio :src="clip.url" controls></audio>
            </li>
          </ul>
        </div>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const gameFolders = ref([]);
    const selectedGameFolder = ref(null);
    const selectedSong = ref(null);
    const songs = ref([]);
    const clips = ref([]);
    const expandedSongFolder = ref(null);

    const fetchGameFolders = async () => {
      try {
        const response = await fetch('/api/game-folders');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); 
        console.log(`Fetched game folders: ${JSON.stringify(data)}`); // Debugging line
        gameFolders.value = data;
      } catch (error) {
        console.error('Failed to fetch game folders:', error);
      }
    };

    const fetchSongsInGameFolder = async (folderPath) => {
      try {
        const response = await fetch(`/api/songs?folderPath=${encodeURIComponent(folderPath)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text(); 
        console.log(`Fetched songs: ${text}`); // Debugging line
        const data = JSON.parse(text); 
        songs.value = data;
      } catch (error) {
        console.error('Error fetching songs in game folder:', error);
        songs.value = [];
      }
    };

    const fetchClipsInSongFolder = async (songFolderPath) => {
      try {
        const response = await fetch(`/api/clips?songFolderPath=${encodeURIComponent(songFolderPath)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Fetched clips: ${JSON.stringify(data)}`); // Debugging line
        clips.value = data;
      } catch (error) {
        console.error('Error fetching clips in song folder:', error);
        clips.value = [];
      }
    };

    const toggleGameFolder = (folder) => {
      if (selectedGameFolder.value === folder) {
        selectedGameFolder.value = null; // Collapse if the same folder is clicked
        selectedSong.value = null;
      } else {
        selectedGameFolder.value = folder;
        selectedSong.value = null;
        fetchSongsInGameFolder(folder);
      }
    };

    const toggleSongFolder = (song) => {
      if (expandedSongFolder.value === song) {
        expandedSongFolder.value = null; // Collapse if the same song folder is clicked
      } else {
        selectedSong.value = song;
        fetchClipsInSongFolder(`${selectedGameFolder.value}/${song}`);
        expandedSongFolder.value = song;
      }
    };

    onMounted(() => {
      fetchGameFolders();
    });

    return {
      gameFolders,
      selectedGameFolder,
      selectedSong,
      songs,
      clips,
      expandedSongFolder,
      toggleGameFolder,
      toggleSongFolder
    };
  }
};
</script>

<style scoped>
.song-browser {
  text-align: left; /* Align all content to the left */
}

.folder-list {
  list-style-type: none;
  padding: 0;
}

.folder-list li {
  cursor: pointer;
  padding: 5px;
  transition: background-color 0.3s;
}

.folder-list li:hover, .folder-list li.selected {
  background-color: #e0e0e0;
}

.song-list {
  list-style-type: none;
  padding: 0;
  padding-left: 20px; /* Indent song folders */
}

.song-list li {
  cursor: pointer;
  padding: 5px;
  transition: background-color 0.3s;
}

.song-list li:hover, .song-list li.selected {
  background-color: #e0e0e0;
}

.clip-list {
  padding-left: 20px; /* Indent clips under the selected song folder */
}

.clip-list ul {
  list-style-type: none;
  padding: 0;
}

.clip-list li {
  margin: 5px 0;
}
</style>