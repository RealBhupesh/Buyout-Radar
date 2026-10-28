import { execFileSync } from "node:child_process";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const expected = Number(
  process.argv.find((arg) => arg.startsWith("--expected="))?.split("=")[1] ||
    100,
);
const commits = git("rev-list", "--reverse", "HEAD").split("\n");
if (commits.length !== expected)
  throw new Error(`Expected ${expected} commits, found ${commits.length}`);
for (const commit of commits)
  if (
    !git("diff-tree", "--root", "--no-commit-id", "--name-only", "-r", commit)
  )
    throw new Error(`Empty commit: ${commit}`);
if (git("status", "--porcelain"))
  throw new Error("Working tree has uncommitted changes");
const sha = git("rev-parse", "HEAD");
if (process.argv.includes("--remote")) {
  const remote = git("ls-remote", "origin", "refs/heads/main").split(/\s/)[0];
  if (remote !== sha) throw new Error("Remote main does not match local HEAD");
}
console.log(
  JSON.stringify(
    {
      commitCount: commits.length,
      nonemptyCommits: commits.length,
      sha,
      workingTree: "clean",
      remoteChecked: process.argv.includes("--remote"),
    },
    null,
    2,
  ),
);
