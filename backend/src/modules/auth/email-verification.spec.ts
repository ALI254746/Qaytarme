import {AuthService} from './auth.service';
import {BadRequestException} from '@nestjs/common';
describe('Ro‘yxatdan o‘tishda email xatosi',()=>{
 it('email yuborilmasa hisobni avtomatik tasdiqlamaydi',async()=>{
  const users={findByEmail:jest.fn().mockResolvedValue(null),create:jest.fn().mockResolvedValue({_id:'u1',email:'test@example.com'}),update:jest.fn()};
  const mail={sendVerificationEmail:jest.fn().mockResolvedValue({success:false,error:'delivery failed'})};
  const service=new AuthService(users as any,{} as any,mail as any);
  await expect(service.register({name:'Test',email:'test@example.com',password:'TestPassword123'} as any)).rejects.toBeInstanceOf(BadRequestException);
  expect(users.create).toHaveBeenCalledWith(expect.objectContaining({isVerified:false}));
  expect(users.update).not.toHaveBeenCalled();
 });
});
