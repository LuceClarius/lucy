import { execSync } from "child_process";

export function commitAndPushUpdate(file: string, message: string) {
  const token = process.env.LUCY_GIT_TOKEN;
  const repo = "github.com/LuceClarius/lucy.git";
  const remote = `https://lucy-bot-dev:${token}@${repo}`;

  execSync("git config --global user.email 'lucy@bot.dev'");
  execSync("git config --global user.name 'Lucy (Bot)'");

  execSync("git add " + file);
  execSync(`git commit -m "${message}"`);
  execSync(`git push ${remote} HEAD:main`);
}
