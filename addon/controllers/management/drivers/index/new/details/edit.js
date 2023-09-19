import ManagementDriversIndexNewDetailsNewController from './new';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ManagementDriversIndexNewDetailsEditController extends ManagementDriversIndexNewDetailsNewController {
    /**
     * True if updating service rate.
     *
     * @var {Boolean}
     */
    @tracked isUpdatingDriver = false;
    /**
     * Updates the drivers to server
     *
     * @void
     */
    @action updateDriver() {
        const { driver } = this;

        this.isUpdatingDriver = true;
        this.loader.showLoader('.overlay-inner-content', 'Updating driver...');

        try {
            return driver
                .save()
                .then((driver) => {
                    return this.transitionToRoute('management.drivers.index').then(() => {
                        this.notifications.success(`Driver '${driver.name}' updated`);
                        this.resetForm();
                        this.hostRouter.refresh();
                    });
                })
                .catch(this.notifications.serverError)
                .finally(() => {
                    this.isUpdatingDriver = false;
                    this.loader.removeLoader();
                });
        } catch (error) {
            this.isUpdatingDriver = false;
            this.loader.removeLoader();
        }
    }
}
