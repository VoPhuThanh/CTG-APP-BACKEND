import { ClubsService } from './clubs.service';

describe('ClubsService', () => {
  let service: ClubsService;

  beforeEach(() => {
    service = new ClubsService(
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
