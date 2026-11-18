// eslint-disable-next-line @typescript-eslint/no-require-imports
const { patchPodfile } = require("./withPodDeploymentTarget");

const PODFILE = `target 'ReproSense' do
  post_install do |installer|
    react_native_post_install(installer)
  end
end
`;

test("raises every pod to the app's deployment target, once", () => {
  const out: string = patchPodfile(PODFILE, "16.4");
  expect(out).toContain("bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.4'");
  expect(out.indexOf("pods_project.targets")).toBeGreaterThan(out.indexOf("react_native_post_install"));
  expect(patchPodfile(out, "16.4")).toBe(out);
});

test("fails loudly if Expo changes the Podfile shape", () => {
  expect(() => patchPodfile("target 'X' do\nend\n", "16.4")).toThrow(/post_install/);
});
