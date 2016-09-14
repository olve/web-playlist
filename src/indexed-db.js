import Builder from 'indexeddb-promised'

//https://github.com/vergara/indexeddb-promised

const builder = new Builder('web-playlist-db')
  .setVersion(1)
  .addObjectStore({
    name: 'tracks',
    keyType: {keyPath: 'id'},
    indexes: [
      {
        name: 'path',
        path: 'path',
        unqiue: false,
      },
      {
        name: 'buffer',
        buffer: 'pcm-buffer',
        unqiue: false,
      },
      {
        name: 'duration',
        duration: 'track duration',
        unique: false,
      },
      {
        name: 'position',
        position: 'current playback time',
        unique: false,
      }
    ]
  })

const db = builder.build()

export default db