module.exports = {
    apps: [
      {
        name: "zpay-backend",
        script: "./ZPAY/dist/index.js",
        cwd: "./ZPAY",
        time: true
      },
      {
        name: "zvault-frontend",
        script: "serve",
        args: "-s Z-vault-admin/dist -l 5173",
        interpreter: "none"
      }
    ]
  }
  