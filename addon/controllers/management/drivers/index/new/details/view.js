import ManagementDriversIndexNewDetailsNewController from './new';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ManagementDriversIndexNewDetailsViewController extends ManagementDriversIndexNewDetailsNewController {
    /**
     * True if updating service rate.
     *
     * @var {Boolean}
     */
    @tracked isUpdatingDriver = false;
}
