import Model, { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';

export default class FuelReportModel extends Model {
  /** @ids */
  @attr('string') public_id;
  @attr('string') company_uuid;
  @attr('string') driver_uuid;
  @attr('string') vehicle_uuid;

  /** @attributes */
  @attr('string') driver_name;
  @attr('string') vehicle_name;
  @attr('string') odometer;
  @attr('string') latitude;
  @attr('string') longitude;
  @attr('point') location;
  @attr('string') amount;
  @attr('string') currency;
  @attr('string') volume;
  @attr('string', { defaultValue: 'L' }) metric_unit;
  @attr('string') type;

  /** @dates */
  @attr('date') deleted_at;
  @attr('date') created_at;
  @attr('date') updated_at;

  /** @computed */
  @computed('updated_at') get updatedAgo() {
    return formatDistanceToNow(this.updated_at);
  }

  @computed('updated_at') get updatedAt() {
    return format(this.updated_at, 'PPP p');
  }

  @computed('updated_at') get updatedAtShort() {
    return format(this.updated_at, 'PP');
  }

  @computed('created_at') get createdAgo() {
    return formatDistanceToNow(this.created_at);
  }

  @computed('created_at') get createdAt() {
    return format(this.created_at, 'PPP p');
  }

  @computed('created_at') get createdAtShort() {
    return format(this.created_at, 'PP');
  }
}