import { execSync } from "child_process"
import { nanoid } from "nanoid"
import path from "path"

export type InputType = "names" | "file" | "squash"

export function am({ patchPath }: { patchPath: string }) {
  process.chdir("/verdaccio/storage")
  // execSync("git init")
  // execSync("git config user.name 'verdaccio'")
  // execSync("git config user.email 'verdaccio@email.com'")
  // execSync("git add .")
  // try {
    //   execSync('git commit -m "git commit before am"')
    // } catch {}
  execSync(`git am -3 ${patchPath}`)
}

export function generateNewPatch({
  inputType,
  packageNames,
  tmpDir,
  patchDir
}: {
  inputType: InputType
  packageNames: string
  tmpDir: string
  patchDir: string
}) {
  execSync(`rm -rf ${patchDir}/*`)
  
  process.chdir(tmpDir)
  if (inputType === "names") {
    execSync(`npm install ${packageNames} --registry=http://verdaccio:4873`)
  } else {
    execSync(`npm install --registry=http://verdaccio:4873`)
  }
  execSync("sleep 1")
  
  execSync("rm -rf ./*")
  
  process.chdir("/verdaccio/storage")
  // in case git repository not inited
  execSync("git init")
  execSync("git config user.email root@163.com")
  execSync("git config user.name root")
  execSync("git add .")
  
  try {
    if (inputType === "names") {
      execSync(`git commit -m "chore(update packages): ${packageNames} added"`)
    } else {
      execSync(
        `git commit -m "chore(update packages): add packages from package.json"`
      )
    }
  } catch {}
  
  const patchNameId = nanoid(8)
  
  const patchBaseName =
  packageNames !== ""
  ? `${packageNames.replace("/", "-").split(" ").join("_")}_${patchNameId}.patch`
  : `package_json_${patchNameId}.patch`
  const patchName = execSync(`git format-patch -1 -o ${patchDir}`)
  .toString()
  .trim()
  
  const patchNewName = path.join(patchDir, patchBaseName)
  execSync(`mv ${patchName} ${patchNewName}`)
  
  return patchNewName
}

export function generateOldPackagesPatch({ patchDir }: { patchDir: string }) {
  execSync(`rm -rf ${patchDir}/*`)
  
  process.chdir("/verdaccio/storage")
  const sha = execSync(
    'git commit-tree HEAD^{tree} -m "all old packages"'
    ).toString()
    if (/^fatal/.test(sha)) {
      throw new Error(sha)
    }
    const patchName = execSync(`git format-patch -1 -o ${patchDir} ${sha}`)
    .toString()
    .trim()
    
    const patchNameId = nanoid(8)
    const patchBaseName = `allOldPackages_${patchNameId}.patch`
  
  const patchNewName = path.join(patchDir, patchBaseName)
  execSync(`mv ${patchName} ${patchNewName}`)

  return patchNewName
}

export function clearOldPackages() {
  execSync("npm cache clean --force")
  process.chdir("/verdaccio/storage")
  execSync("rm -rf ./.git/*")
  execSync("git init")
  execSync("rm -rf ./data/*")
}
