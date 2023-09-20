import ManagementVehiclesIndexDetailsNewController from './new';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ManagementVehiclesIndexDetailsEditController extends ManagementVehiclesIndexDetailsNewController {
  /**
     * True if updating service rate.
     *
     * @var {Boolean}
     */
  @tracked isUpdatingVehicle = false;
  /**
   * Updates the drivers to server
   *
   * @void
   */
  @action updateVehicle() {
    const { vehicle } = this;

    this.isUpdatingVehicle = true;
    this.loader.showLoader('.overlay-inner-content', 'Updating vehicle...');

    try {
      return vehicle
        .save()
        .then((vehicle) => {
          log
          return this.transitionToRoute('management.vehicles.index').then(() => {
            this.notifications.success(`Vehicle '${vehicle.name}' updated`);
            this.resetForm();
            this.hostRouter.refresh();
          });
        })
        .catch(this.notifications.serverError)
        .finally(() => {
          this.isUpdatingVehicle = false;
          this.loader.removeLoader();
        });
    } catch (error) {
      this.isUpdatingVehicle = false;
      this.loader.removeLoader();
    }
  }
}
