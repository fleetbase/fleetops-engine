import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ManagementVehiclesIndexNewController extends Controller {
  /**
   * Inject the `currentUser` service
   *
   * @var {Service}
   */
  @service store;

  /**
   * Resets the service rate form
   *
   * @void
   */
  @action resetForm() {
    this.drivers = this.store.createRecord('vehicle');
  }

  /**
   * Handle back button action
   *
   * @return {Transition}
   */
  @action transitionBack() {
    return this.transitionToRoute('management.vehicles.index').then(() => {
      this.resetForm();
    });
  }
}
