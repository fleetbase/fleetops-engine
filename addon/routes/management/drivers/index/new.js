import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ManagementDriversIndexNewRoute extends Route {
  @service currentUser;
  @service loader;

  @action willTransition() {
    this.controller?.resetForm();
  }

  async setupController(controller) {
    controller.types = await this.currentUser.getInstalledOrderConfigs();
  }
}
