import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import generateSlug from '@fleetbase/ember-core/utils/generate-slug';

export default class ManagementVehiclesIndexDetailsNewController extends Controller {
  /**
     * Inject the `management.drivers.index` controller
     *
     * @var {Controller}
     */
  @controller('management.vehicles.index') index;

  /**
   * Inject the `currentUser` service
   *
   * @var {Service}
   */
  @service store;

  /**
   * Inject the `hostRouter` service
   *
   * @var {Service}
   */
  @service hostRouter;

  /**
   * Inject the `notifications` service
   *
   * @var {Service}
   */
  @service notifications;

  /**
   * Inject the `loader` service
   *
   * @var {Service}
   */
  @service loader;

  /**
   * The driver being created.
   *
   * @var {DriversModel}
   */
  /**
   * The driver being created.
   *
   * @var {DriverModel}
   */
  @tracked driver = this.store.createRecord('vehicle', {
    status: `active`,
    slug: generateSlug(),
  });

  /**
   * Different service types available, based on order type.
   *
   * @var {Array}
   */
  @tracked serviceTypes = [];

  /**
   * Service areas.
   *
   * @var {Array}
   */
  @tracked serviceAreas = [];

  /**
   * Zones.
   *
   * @var {Array}
   */
  @tracked zones = [];

  /**
   * True if creating driver.
   *
   * @var {Boolean}
   */
  @tracked isCreatingDriver = false;

  /**
   * True if updating driver.
   *
   * @var {Boolean}
   */
  @tracked isUpdatingServiceRate = false;

  /**
   * Saves the driver to server
   *
   * @void
   */
  @action createDriver() {
    const { driver } = this;

    this.isCreatingDriver = true;
    this.loader.showLoader('.overlay-inner-content', 'Creating vehicle...');

    try {
      return driver
        .save()
        .then((driver) => {
          return this.transitionToRoute('management.vehicles.index').then(() => {
            this.notifications.success(`New Vehicles ${driver.name} Created`);
            this.resetForm();
            this.hostRouter.refresh();
          });
        })
        .catch((error) => {
          console.log(error);
          this.notifications.serverError(error);
        })
        .finally(() => {
          this.isCreatingDriver = false;
          this.loader.removeLoader();
        });
    } catch (error) {
      this.isCreatingDriver = false;
      this.loader.removeLoader();
    }
  }

  /**
   * Resets the driver form
   *
   * @void
   */
  @action resetForm() {
    this.driver = this.store.createRecord('vehicle');
  }
}
