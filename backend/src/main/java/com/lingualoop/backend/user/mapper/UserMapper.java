package com.lingualoop.backend.user.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.entity.User;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface UserMapper {

    // User không có thuộc tính googleLinked: suy ra từ việc đã gắn Google sub vào auth_uid
    @Mapping(target = "googleLinked", expression = "java(user.getAuthUid() != null)")
    UserAccount toUserAccount(User user);
}
