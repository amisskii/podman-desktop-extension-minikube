import { 
    expect as playExpect, 
    ExtensionsPage,  
    test, 
    waitForPodmanMachineStartup, 
} from '@podman-desktop/tests-playwright';

const EXTENSION_IMAGE: string = 'ghcr.io/podman-desktop/podman-desktop-extension-minikube:nightly';
const EXTENSION_NAME: string = 'minikube';
const EXTENSION_LABEL: string = 'podman-desktop.minikube';

let extensionsPage: ExtensionsPage; 

const skipExtensionInstallation = process.env.SKIP_EXTENSION_INSTALL ? process.env.SKIP_EXTENSION_INSTALL : false;

test.beforeAll(async ({ runner, page, welcomePage }) => {
    runner.setVideoAndTraceName('minikube-extension-e2e');
    await welcomePage.handleWelcomePage(true);
    await waitForPodmanMachineStartup(page);
    extensionsPage = new ExtensionsPage(page); 
});

test.afterAll(async ({ runner }) => {
    await runner.close();   
});

test.describe.serial('Podman Desktop Minikube Extension Tests', () => {

    test('Install Minikube extension from OCI image', async ({ navigationBar }) => {
        test.skip(!!skipExtensionInstallation, 'Skipping extension installation');
        
        await navigationBar.openExtensions();
        await playExpect(extensionsPage.header).toBeVisible();
        await playExpect.poll(async () => extensionsPage.extensionIsInstalled(EXTENSION_LABEL)).toBeFalsy();
        await extensionsPage.openCatalogTab();
        await extensionsPage.installExtensionFromOCIImage(EXTENSION_IMAGE);
    });

    test('Verify Minikube extension is installed and active', async ({ navigationBar }) => {
        await navigationBar.openExtensions();
        await playExpect(extensionsPage.header).toBeVisible();
        await playExpect.poll(async () => extensionsPage.extensionIsInstalled(EXTENSION_LABEL)).toBeTruthy();
        const minikubeExtension = await extensionsPage.getInstalledExtension(EXTENSION_NAME, EXTENSION_LABEL);
        await playExpect(minikubeExtension.status).toHaveText('ACTIVE');
    });

    test('Ensure Minikube extension details page is correctly displayed', async () => {
        const minikubeExtension = await extensionsPage.getInstalledExtension(EXTENSION_NAME, EXTENSION_LABEL);
        const minikubeDetails = await minikubeExtension.openExtensionDetails('Minikube extension');
        await playExpect(minikubeDetails.heading).toBeVisible();
        await playExpect(minikubeDetails.status).toHaveText('ACTIVE');
        await playExpect(minikubeDetails.tabContent).toBeVisible();
    });

    test('Ensure Minikube extension can be disabled and enabled', async ({ navigationBar }) => {
        await navigationBar.openExtensions();
        await playExpect(extensionsPage.header).toBeVisible();

        const minikubeExtension = await extensionsPage.getInstalledExtension(EXTENSION_NAME, EXTENSION_LABEL);
        await minikubeExtension.disableExtension();
        await playExpect(minikubeExtension.enableButton).toBeEnabled();

        await minikubeExtension.enableExtension();
        await playExpect(minikubeExtension.disableButton).toBeEnabled();
    });

    test('Uninstall Minikube extension', async ({ navigationBar }) => {
        await navigationBar.openExtensions();
        await playExpect(extensionsPage.header).toBeVisible();
        const minikubeExtension = await extensionsPage.getInstalledExtension(EXTENSION_NAME, EXTENSION_LABEL);
        await minikubeExtension.removeExtension();
    });
});
