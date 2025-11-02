import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get Git information at build time
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
    const commitDate = execSync('git log -1 --format=%cd --date=short').toString().trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    return { commitHash, commitDate, branch }
  } catch (error) {
    // Fallback if git is not available
    return { commitHash: 'unknown', commitDate: 'unknown', branch: 'unknown' }
  }
}

const gitInfo = getGitInfo()

export default defineConfig({
  plugins: [react()],
  base: '/vibeshack/',
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(gitInfo.commitHash),
    __GIT_COMMIT_DATE__: JSON.stringify(gitInfo.commitDate),
    __GIT_BRANCH__: JSON.stringify(gitInfo.branch),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  }
})
