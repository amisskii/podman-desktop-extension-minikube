/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { createMinikubeCluster} from '../utility/operations';
import { checkKubernetesResourceState, deleteCluster, ensureCliInstalled, KubernetesResources, KubernetesResourceState, test} from '@podman-desktop/tests-playwright';

const CLUSTER_NAME: string = 'minikube';
const MINIKUBE_NODE: string = CLUSTER_NAME;
const RESOURCE_NAME: string = 'minikube';
const CLUSTER_CREATION_TIMEOUT: number = 300_000;


const skipExtensionInstallation = process.env.SKIP_EXTENSION_INSTALL === 'true';
const driverGHA = process.env.MINIKUBE_DRIVER_GHA ?? '';;

test.beforeAll(async ({ runner, welcomePage, page, navigationBar }) => {
  test.setTimeout(CLUSTER_CREATION_TIMEOUT);
  runner.setVideoAndTraceName('minikube-kubernetes-e2e');
  await welcomePage.handleWelcomePage(true);

  if (!skipExtensionInstallation) {
    const settingsBar = await navigationBar.openSettings();
    await settingsBar.cliToolsTab.click();

    await ensureCliInstalled(page, 'Minikube');
  }

  if (process.env.GITHUB_ACTIONS && process.env.RUNNER_OS === 'Linux') {
    await createMinikubeCluster(page, CLUSTER_NAME, false, CLUSTER_CREATION_TIMEOUT, {driver: driverGHA});
  } else {
    await createMinikubeCluster(page, CLUSTER_NAME, true, CLUSTER_CREATION_TIMEOUT);
  }
});

test.afterAll(async ({ runner, page }) => {
  test.setTimeout(90000);
  try {
    await deleteCluster(page, RESOURCE_NAME, MINIKUBE_NODE, CLUSTER_NAME);
  } finally {
    await runner.close();
  }
});

test.describe('Kubernetes resources End-to-End test', { tag: '@k8s_e2e' }, () => {
  test('Kubernetes Nodes test', async ({ page }) => {
    await checkKubernetesResourceState(page, KubernetesResources.Nodes, MINIKUBE_NODE, KubernetesResourceState.Running);
  });
});
