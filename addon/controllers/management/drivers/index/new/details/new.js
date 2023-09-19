import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isBlank } from '@ember/utils';
import generateSlug from '@fleetbase/ember-core/utils/generate-slug';
import Point from '@fleetbase/fleetops-data/utils/geojson/point';

export default class OperationsDriversIndexNewDetailsDriverController extends Controller {
  /**
     * Inject the `management.drivers.index` controller
     *
     * @var {Controller}
     */
  @controller('management.drivers.index') index;

  /**
   * Inject the `currentUser` service 
   *
   * @var {Service} 
   */
  @service store;

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
   * The service rate being created.
   *
   * @var {DriversModel}
   */
  /**
   * The driver being created.
   *
   * @var {DriverModel}
   */
  @tracked driver = this.store.createRecord('driver', {
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
   * True if creating service rate.
   *
   * @var {Boolean}
   */
  @tracked isCreatingDriver = false;

  /**
   * True if updating service rate.
   *
   * @var {Boolean}
   */
  @tracked isUpdatingServiceRate = false;

  /**
   * Edit a `driver` details
   *
   * @param {DriverModel} driver
   * @param {Object} options
   * @void
   */
  @action editDriver(driver, options = {}) {
    // make sure vehicle is loaded
    driver.loadVehicle();
    this.modalsManager.show('modals/driver-form', {
      title: 'Edit Driver',
      acceptButtonText: 'Save Changes',
      acceptButtonIcon: 'save',
      declineButtonIcon: 'times',
      declineButtonIconPrefix: 'fas',
      driver,
      uploadNewPhoto: (file) => {
        this.fetch.uploadFile.perform(
          file,
          {
            path: `uploads/${this.currentUser.companyId}/drivers/${driver.slug}`,
            subject_uuid: driver.id,
            subject_type: `driver`,
            type: `driver_photo`,
          },
          (uploadedFile) => {
            driver.setProperties({
              photo_uuid: uploadedFile.id,
              photo_url: uploadedFile.url,
              photo: uploadedFile,
            });
          }
        );
      },
      confirm: (modal, done) => {
        modal.startLoading();

        if (isBlank(driver.location)) {
          // set default location from currentUser service
          const { latitude, longitude } = this.currentUser;
          driver.set('location', new Point(latitude, longitude));
        }

        driver
          .save()
          .then((driver) => {
            if (typeof options.successNotification === 'function') {
              this.notifications.success(options.successNotification(driver));
            } else {
              this.notifications.success(options.successNotification || `${driver.name} details updated.`);
            }

            done();
          })
          .catch((error) => {
            // driver.rollbackAttributes();
            modal.stopLoading();
            this.notifications.serverError(error);
          });
      },
      ...options,
    });
  }

  /**
  * Saves the service rate to server
  *
  * @void
  */
  @action createDriver() {
    const { driver } = this;

    this.isCreatingDriver = true;
    this.loader.showLoader('.overlay-inner-content', 'Creating driver...');

    try {
      return driver
        .save()
        .then((driver) => {
          console.log(driver.name);
          // this.index.table.addRow(driver);

          // return this.transitionToRoute('management.drivers.index').then(() => {
          //   this.notifications.success(`New driver (${driver.name}) created.`);
          //   this.resetForm();
          // });
        })
        .catch((error) => {
          console.log(error);
          // this.notifications.serverError(error);
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
}
