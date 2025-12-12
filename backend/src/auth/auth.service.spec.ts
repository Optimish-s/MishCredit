import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { AuthService, LoginResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockHttpService: jest.Mocked<HttpService>;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();

    process.env = { ...originalEnv };
    process.env.USE_STUBS = 'false';
    process.env.UCN_BASE_PUCLARO = 'https://api.ucn.cl';

    mockHttpService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== login() Tests ====================
  describe('login()', () => {
    describe('when USE_STUBS is true', () => {
      beforeEach(async () => {
        process.env.USE_STUBS = 'true';

      });

      it('should return user data for valid credentials (email)', async () => {
        const result = await service.login('juan@example.com', '1234');

        expect(result).toEqual({
          rut: '333333333',
          carreras: [{ codigo: '8606', nombre: 'ICCI', catalogo: '201610' }],
        });
        expect(mockHttpService.get).not.toHaveBeenCalled();
      });

      it('should return user data for valid credentials (rut)', async () => {
        const result = await service.login('333333333', '1234');

        expect(result).toEqual({
          rut: '333333333',
          carreras: [{ codigo: '8606', nombre: 'ICCI', catalogo: '201610' }],
        });
      });

      it('should throw BadRequestException for invalid credentials', async () => {
        await expect(service.login('wrong@email.com', 'wrongpass')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.login('wrong@email.com', 'wrongpass')).rejects.toThrow(
          'credenciales invalidas',
        );
      });

      it('should throw BadRequestException for wrong password', async () => {
        await expect(service.login('juan@example.com', 'wrongpass')).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('when USE_STUBS is false (HTTP calls)', () => {
      beforeEach(async () => {
        process.env.USE_STUBS = 'false';

      });

      it('should return login response on successful API call', async () => {
        const mockLoginResponse: LoginResponse = {
          rut: '12345678-9',
          carreras: [{ codigo: '8606', nombre: 'ICCI', catalogo: '201610' }],
        };

        const mockAxiosResponse: AxiosResponse<LoginResponse> = {
          data: mockLoginResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

        const result = await service.login('test@email.com', 'password123');

        expect(result).toEqual(mockLoginResponse);
        expect(mockHttpService.get).toHaveBeenCalledWith(
          expect.stringContaining(
            'https://api.ucn.cl/login.php?email=test%40email.com&password=password123',
          ),
        );
      });

      it('should encode special characters in email and password', async () => {
        const mockLoginResponse: LoginResponse = {
          rut: '12345678-9',
          carreras: [],
        };

        const mockAxiosResponse: AxiosResponse<LoginResponse> = {
          data: mockLoginResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

        await service.login('user+test@email.com', 'pass&word=123');

        expect(mockHttpService.get).toHaveBeenCalledWith(
          expect.stringContaining('email=user%2Btest%40email.com'),
        );
        expect(mockHttpService.get).toHaveBeenCalledWith(
          expect.stringContaining('password=pass%26word%3D123'),
        );
      });

      it('should throw HttpException when API returns error', async () => {
        const mockError = {
          response: {
            status: 401,
            data: { message: 'Unauthorized' },
          },
        };

        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        await expect(service.login('test@email.com', 'wrongpass')).rejects.toThrow(
          HttpException,
        );

        try {
          await service.login('test@email.com', 'wrongpass');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(401);
          expect(error.getResponse()).toEqual({ message: 'Unauthorized' });
        }
      });

      it('should throw HttpException with 502 when no response', async () => {
        const mockError = {
          response: undefined,
        };

        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        try {
          await service.login('test@email.com', 'password');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(502);
          expect(error.getResponse()).toEqual({ message: 'upstream error' });
        }
      });

      it('should throw HttpException with 502 when response has no rut', async () => {
        const mockLoginResponse = {
          rut: null,
          carreras: [],
        };

        const mockAxiosResponse: AxiosResponse = {
          data: mockLoginResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

        await expect(service.login('test@email.com', 'password')).rejects.toThrow(
          HttpException,
        );

        try {
          await service.login('test@email.com', 'password');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(502);
          expect(error.getResponse()).toEqual({ message: 'respuesta invalida desde UCN' });
        }
      });

      it('should return empty carreras array when API returns null', async () => {
        const mockLoginResponse = {
          rut: '12345678-9',
          carreras: null,
        };

        const mockAxiosResponse: AxiosResponse = {
          data: mockLoginResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

        const result = await service.login('test@email.com', 'password');

        expect(result.carreras).toEqual([]);
      });

      it('should wrap string error payload in object', async () => {
        const mockError = {
          response: {
            status: 400,
            data: 'Bad request string',
          },
        };

        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        try {
          await service.login('test@email.com', 'password');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getResponse()).toEqual({ message: 'Bad request string' });
        }
      });
    });
  });

  // ==================== forgot() Tests ====================
  describe('forgot()', () => {
    describe('when USE_STUBS is true', () => {
      beforeEach(async () => {

        process.env.USE_STUBS = 'true';
      });

      it('should return success message for valid rut and email', () => {
        const result = service.forgot({ rut: '333333333', email: 'juan@example.com' });

        expect(result).toEqual({
          ok: true,
          message: 'se envio un correo temporal',
        });
      });

      it('should throw BadRequestException for non-matching rut', () => {
        expect(() => service.forgot({ rut: 'wrongrut', email: 'juan@example.com' })).toThrow(
          BadRequestException,
        );
        expect(() => service.forgot({ rut: 'wrongrut', email: 'juan@example.com' })).toThrow(
          'rut o email no coinciden',
        );
      });

      it('should throw BadRequestException for non-matching email', () => {
        expect(() => service.forgot({ rut: '333333333', email: 'wrong@email.com' })).toThrow(
          BadRequestException,
        );
      });

      it('should throw BadRequestException when user not found', () => {
        expect(() => service.forgot({ rut: 'unknown', email: 'unknown@email.com' })).toThrow(
          BadRequestException,
        );
      });

      it('should handle missing rut', () => {
        expect(() => service.forgot({ email: 'juan@example.com' })).toThrow(
          BadRequestException,
        );
      });

      it('should handle missing email', () => {
        expect(() => service.forgot({ rut: '333333333' })).toThrow(
          BadRequestException,
        );
      });
    });

    describe('when USE_STUBS is false', () => {
      it('should return undefined (not implemented)', () => {
        const result = service.forgot({ rut: '333333333', email: 'juan@example.com' });

        expect(result).toBeUndefined();
      });
    });
  });
});