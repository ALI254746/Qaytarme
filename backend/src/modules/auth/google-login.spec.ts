import { AuthService } from './auth.service';
import { OAuth2Client } from 'google-auth-library';
import { UnauthorizedException } from '@nestjs/common';
jest.mock('google-auth-library',()=>({OAuth2Client:jest.fn()}));
describe('Google tasdig‘i',()=>{
 const verify=jest.fn();
 const users={findByEmail:jest.fn(),create:jest.fn(),update:jest.fn()};
 const jwt={sign:jest.fn(()=> 'backend-token')};
 let service:AuthService;
 const original=process.env.GOOGLE_CLIENT_ID;
 beforeEach(()=>{jest.clearAllMocks();process.env.GOOGLE_CLIENT_ID='test-client';(OAuth2Client as unknown as jest.Mock).mockImplementation(()=>({verifyIdToken:verify}));service=new AuthService(users as any,jwt as any,{} as any);});
 afterAll(()=>{if(original===undefined)delete process.env.GOOGLE_CLIENT_ID;else process.env.GOOGLE_CLIENT_ID=original;});
 it('emailning o‘zi bilan kirishga ruxsat bermaydi',async()=>{await expect(service.googleLogin(undefined as any)).rejects.toBeInstanceOf(UnauthorizedException);expect(users.findByEmail).not.toHaveBeenCalled();});
 it('noto‘g‘ri token hisob yaratmaydi',async()=>{verify.mockRejectedValue(new Error('invalid'));await expect(service.googleLogin('bad')).rejects.toBeInstanceOf(UnauthorizedException);expect(users.create).not.toHaveBeenCalled();});
 it('tasdiqlanmagan emailni rad etadi',async()=>{verify.mockResolvedValue({getPayload:()=>({sub:'123',email:'test@example.com',email_verified:false})});await expect(service.googleLogin('token')).rejects.toBeInstanceOf(UnauthorizedException);expect(users.findByEmail).not.toHaveBeenCalled();});
 it('tasdiqlangan mavjud hisobga kiradi',async()=>{verify.mockResolvedValue({getPayload:()=>({sub:'123',email:'test@example.com',email_verified:true})});users.findByEmail.mockResolvedValue({_id:'user1',email:'test@example.com',name:'Test',role:'user',isVerified:true});const result=await service.googleLogin('valid');expect(verify).toHaveBeenCalledWith({idToken:'valid',audience:'test-client'});expect(result.user.id).toBe('user1');expect(users.create).not.toHaveBeenCalled();expect(result.access_token).toBe('backend-token');});
});
