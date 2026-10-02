import {OperationsController} from './operations.controller';
import {OperationsService} from './operations.service';
import {ForbiddenException,ConflictException,BadRequestException} from '@nestjs/common';
describe('Operations authorization',()=>{
 const mock={overview:jest.fn(),report:jest.fn()};
 const controller=new OperationsController(mock as any);
 beforeEach(()=>jest.clearAllMocks());
 it('rejects non-admin overview requests',()=>{expect(()=>controller.overview({user:{id:'a',role:'user'}})).toThrow(ForbiddenException);expect(mock.overview).not.toHaveBeenCalled();});
 it('permits an authenticated user to submit their own report',()=>{const dto={itemId:'650000000000000000000001',reason:'privacy'};controller.report(dto as any,{user:{id:'user1',role:'user'}});expect(mock.report).toHaveBeenCalledWith(dto,'user1');});
});
describe('Moderation decisions',()=>{
 const id='650000000000000000000001';
 let service:OperationsService,items:any,audit:any,matches:any;
 beforeEach(()=>{items={findById:jest.fn(),findByIdAndUpdate:jest.fn()};audit={create:jest.fn().mockResolvedValue({})};matches={findAndCreateMatches:jest.fn().mockResolvedValue([])};service=new OperationsService(items,{} as any,{} as any,audit,{} as any,{} as any,{} as any,matches);});
 it('preserves a confirmed returned item',async()=>{items.findById.mockResolvedValue({moderationStatus:'returned'});await expect(service.decision(id,{status:'approved',note:'ok'},'admin')).rejects.toThrow(ConflictException);expect(items.findByIdAndUpdate).not.toHaveBeenCalled();});
 it('requires a moderator explanation',async()=>{await expect(service.decision(id,{status:'rejected',note:' '},'admin')).rejects.toThrow(BadRequestException);expect(audit.create).not.toHaveBeenCalled();});
 it('starts matching only after approval and records the decision',async()=>{items.findById.mockResolvedValue({moderationStatus:'pending'});const item={_id:id,moderationStatus:'approved'};items.findByIdAndUpdate.mockResolvedValue(item);await service.decision(id,{status:'approved',note:'Tekshirildi',hideImages:true},'admin');expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({action:'moderation',actor:'admin'}));expect(matches.findAndCreateMatches).toHaveBeenCalledWith(item);expect(items.findByIdAndUpdate).toHaveBeenCalledWith(id,{$set:{moderationStatus:'approved',imageVisibility:'hidden'}},{new:true});});
 it('does not trigger matching for a rejected item',async()=>{items.findById.mockResolvedValue({moderationStatus:'pending'});items.findByIdAndUpdate.mockResolvedValue({_id:id,moderationStatus:'rejected'});await service.decision(id,{status:'rejected',note:'Maxfiy ma’lumot'},'admin');expect(matches.findAndCreateMatches).not.toHaveBeenCalled();});
});

