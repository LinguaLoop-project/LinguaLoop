package com.lingualoop.backend.subscription.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.subscription.entity.PlanLimit;

public interface PlanLimitRepository extends JpaRepository<PlanLimit, PlanLimit.Key> {

    List<PlanLimit> findByIdPlanOrderByIdFeature(String plan);
}
