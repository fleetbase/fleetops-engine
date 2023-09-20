import ManagementVehiclesIndexDetailsNewController from './new';

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
  @action updateDriver() {
    const { vehicle } = this;

    this.isUpdatingVehicle = true;
    this.loader.showLoader('.overlay-inner-content', 'Updating vehicle...');

    try {
      return driver
        .save()
        .then((driver) => {
          return this.transitionToRoute('management.vehicles.index').then(() => {
            this.notifications.success(`Driver '${driver.name}' updated`);
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
