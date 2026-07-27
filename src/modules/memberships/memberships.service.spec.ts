import { MembershipsService } from './memberships.service';

describe('MembershipsService', () => {
  let service: MembershipsService;

  beforeEach(() => {
    service = new MembershipsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
