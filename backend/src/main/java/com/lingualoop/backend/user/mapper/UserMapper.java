package com.lingualoop.backend.user.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.dto.response.MeResponse;
import com.lingualoop.backend.user.entity.User;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface UserMapper {

    // User không có thuộc tính googleLinked: suy ra từ việc đã gắn Google sub vào auth_uid
    @Mapping(target = "googleLinked", expression = "java(user.getAuthUid() != null)")
    UserAccountView toUserAccountView(User user);

    @Mapping(target = "role", expression = "java(view.role().value())")
    @Mapping(target = "hasPassword", expression = "java(view.hasPassword())")
    MeResponse toMe(UserAccountView view);
}
