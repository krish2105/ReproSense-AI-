// Xcode 27 refuses device builds when a pod targets iOS older than 15 (RNCMaskedView 9.0, RNDateTimePicker 11.0,
// ReachabilitySwift 12.0 ...). The simulator build still passes, so this shows only on a real iPhone. This plugin adds
// a post_install step to the generated ios/Podfile that raises every pod to the app's own deployment target.
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const MARKER = "# reprosense: pod deployment target";

function patchPodfile(podfile, target) {
  if (podfile.includes(MARKER)) return podfile;
  const hook = "  post_install do |installer|\n";
  const start = podfile.indexOf(hook);
  const end = start < 0 ? -1 : podfile.indexOf("\n  end\n", start);
  if (end < 0) throw new Error("withPodDeploymentTarget: post_install block not found in Podfile");
  const step = [
    `    ${MARKER}`,
    "    installer.pods_project.targets.each do |t|",
    "      t.build_configurations.each do |bc|",
    `        if bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${target}`,
    `          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${target}'`,
    "        end",
    "      end",
    "    end",
    "",
  ].join("\n");
  // Last in post_install, after react_native_post_install, so nothing resets it afterwards.
  return podfile.slice(0, end + 1) + step + podfile.slice(end + 1);
}

function withPodDeploymentTarget(config, { target = "16.4" } = {}) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      fs.writeFileSync(file, patchPodfile(fs.readFileSync(file, "utf8"), target));
      return cfg;
    },
  ]);
}

module.exports = withPodDeploymentTarget;
module.exports.patchPodfile = patchPodfile;
