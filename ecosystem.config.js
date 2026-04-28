module.exports = {
  apps: [
    {
      name: "emfrontier-main",
      script: "npm",
      args: "start -- -p 8081",
      cwd: "/home/work/.openclaw/workspace/emfrontier/emfrontier-website",
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      watch: false,
    },
  ],
};
